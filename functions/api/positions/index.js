import { getDb, unwrap } from '../_lib/db.js'
import { getSession, unauthorized } from '../_lib/auth.js'
import { json, readJson, methodNotAllowed } from '../_lib/respond.js'
import { discoverPositions, withIl } from '../_lib/uniswap.js'

const REFRESH_COOLDOWN_MS = 60_000

async function loadWallets(db, userId) {
  return unwrap(
    await db
      .from('wallets')
      .select('id, address, label, created_at')
      .eq('user_id', userId)
      .order('created_at'),
    'list wallets'
  )
}

async function loadPositions(db, walletIds) {
  if (walletIds.length === 0) return []
  return unwrap(
    await db
      .from('positions')
      .select()
      .in('wallet_id', walletIds)
      .order('first_seen', { ascending: false }),
    'list positions'
  )
}

// Re-discover one wallet's positions and sync the table:
// new position -> insert with entry_snapshot = current state;
// existing      -> update liquidity/last_snapshot/in_range;
// closed        -> delete (liquidity now 0 or NFT no longer owned).
async function refreshWallet(db, wallet, env) {
  const { positions: found, errors } = await discoverPositions(wallet.address, env)

  const existing = unwrap(
    await db.from('positions').select().eq('wallet_id', wallet.id),
    'load positions'
  )
  const byKey = new Map(existing.map((p) => [`${p.chain}:${p.nft_token_id}`, p]))
  const seen = new Set()
  const now = new Date().toISOString()

  const rows = found.map((f) => {
    const key = `${f.chain}:${f.nft_token_id}`
    seen.add(key)
    const prev = byKey.get(key)
    const entry = prev?.entry_snapshot ?? f.snapshot
    const last = withIl(f.snapshot, entry)
    return {
      ...(prev ? { id: prev.id } : {}),
      wallet_id: wallet.id,
      protocol: f.protocol,
      chain: f.chain,
      pool_address: f.pool_address,
      nft_token_id: f.nft_token_id,
      token0: { ...f.token0, fee: f.fee },
      token1: f.token1,
      tick_lower: f.tick_lower,
      tick_upper: f.tick_upper,
      liquidity: f.liquidity,
      entry_snapshot: entry,
      last_snapshot: last,
      in_range: f.in_range,
      updated_at: now,
      ...(prev ? {} : { first_seen: now }),
    }
  })

  if (rows.length > 0) {
    const saved = unwrap(
      await db
        .from('positions')
        .upsert(rows, { onConflict: 'wallet_id,chain,nft_token_id' })
        .select('id, chain, nft_token_id'),
      'upsert positions'
    )

    // Daily history point per position (one row per UTC day; the last refresh
    // of a day wins). A snapshot failure must never sink the refresh itself.
    try {
      const idByKey = new Map(saved.map((p) => [`${p.chain}:${p.nft_token_id}`, p.id]))
      const day = now.slice(0, 10)
      const snapshotRows = rows
        .map((r) => {
          const positionId = idByKey.get(`${r.chain}:${r.nft_token_id}`)
          if (!positionId) return null
          const last = r.last_snapshot
          return {
            position_id: positionId,
            day,
            value_usd: last.valueUsd,
            il_pct: last.ilPct,
            il_usd: last.ilUsd,
            fees_usd: last.feesUsd,
            in_range: r.in_range,
          }
        })
        .filter(Boolean)
      if (snapshotRows.length > 0) {
        unwrap(
          await db
            .from('position_snapshots')
            .upsert(snapshotRows, { onConflict: 'position_id,day' }),
          'write position snapshots'
        )
      }
    } catch (err) {
      console.error('position snapshot write failed:', err.message)
    }
  }

  // remove closed positions — but only when discovery fully succeeded,
  // otherwise a chain outage would wrongly wipe that chain's rows
  const failedChains = new Set(errors.map((e) => e.chain))
  const stale = existing.filter((p) => !seen.has(`${p.chain}:${p.nft_token_id}`) && !failedChains.has(p.chain))
  if (stale.length > 0) {
    unwrap(
      await db.from('positions').delete().in('id', stale.map((p) => p.id)),
      'prune closed positions'
    )
  }

  return errors
}

export async function onRequest({ request, env }) {
  const session = await getSession(request, env)
  if (!session) return unauthorized()

  try {
    const db = getDb(env)
    const wallets = await loadWallets(db, session.userId)

    if (request.method === 'GET') {
      const positions = await loadPositions(db, wallets.map((w) => w.id))
      return json({ positions, wallets })
    }

    if (request.method === 'POST') {
      const body = (await readJson(request)) || {}
      const walletId = String(body.walletId || '').trim() || null
      let targets = wallets
      if (walletId) {
        // wallet-scoped refresh (fired right after adding a wallet) skips the
        // cooldown — it's naturally limited by the 5-wallet cap
        targets = wallets.filter((w) => w.id === walletId)
        if (targets.length === 0) return json({ error: 'Wallet not found.' }, 404)
      } else {
        const user = unwrap(
          await db.from('users').select('last_refresh_at').eq('id', session.userId).single(),
          'load user'
        )
        const last = user.last_refresh_at ? new Date(user.last_refresh_at).getTime() : 0
        const elapsed = Date.now() - last
        if (elapsed < REFRESH_COOLDOWN_MS) {
          const retryAfter = Math.ceil((REFRESH_COOLDOWN_MS - elapsed) / 1000)
          return json(
            { error: `Refresh is limited to once a minute — try again in ${retryAfter}s.`, retryAfter },
            429,
            { 'Retry-After': String(retryAfter) }
          )
        }
        unwrap(
          await db.from('users').update({ last_refresh_at: new Date().toISOString() }).eq('id', session.userId),
          'stamp refresh'
        )
      }

      const errors = []
      for (const wallet of targets) {
        try {
          errors.push(...(await refreshWallet(db, wallet, env)))
        } catch (err) {
          console.error(`refresh ${wallet.address} failed:`, err.message)
          errors.push({ chain: 'all', wallet: wallet.address, message: 'Position discovery failed for this wallet.' })
        }
      }

      const positions = await loadPositions(db, wallets.map((w) => w.id))
      return json({ positions, wallets, errors })
    }

    return methodNotAllowed()
  } catch (err) {
    console.error('positions error:', err.message)
    return json({ error: err.status ? err.message : 'Position operation failed.' }, err.status || 500)
  }
}
