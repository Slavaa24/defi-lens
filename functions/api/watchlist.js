import { getDb, unwrap } from './_lib/db.js'
import { getSession, unauthorized } from './_lib/auth.js'
import { json, readJson, methodNotAllowed } from './_lib/respond.js'

// DefiLlama pool ids are uuid-style strings; be lenient but bounded.
const POOL_ID_RE = /^[a-zA-Z0-9-]{1,64}$/
const MAX_IDS_PER_CALL = 300
const MAX_WATCHLIST = 500

async function listIds(db, userId) {
  const rows = unwrap(
    await db.from('watchlist').select('pool_id').eq('user_id', userId).order('created_at'),
    'list watchlist'
  )
  return rows.map((r) => r.pool_id)
}

export async function onRequest({ request, env }) {
  const session = await getSession(request, env)
  if (!session) return unauthorized()

  try {
    const db = getDb(env)

    if (request.method === 'GET') {
      return json({ poolIds: await listIds(db, session.userId) })
    }

    // POST adds one or many ids (idempotent upsert) — also used to merge the
    // localStorage watchlist into the account on first signed-in load.
    if (request.method === 'POST') {
      const body = (await readJson(request)) || {}
      const raw = Array.isArray(body.poolIds) ? body.poolIds : []
      const poolIds = [...new Set(raw.map(String))].filter((id) => POOL_ID_RE.test(id))
      if (poolIds.length === 0) {
        return json({ error: 'Expected { poolIds: [...] } with valid pool ids.' }, 400)
      }
      if (poolIds.length > MAX_IDS_PER_CALL) {
        return json({ error: `Too many pool ids in one request (max ${MAX_IDS_PER_CALL}).` }, 400)
      }

      const { count } = await db
        .from('watchlist')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.userId)
      if ((count ?? 0) + poolIds.length > MAX_WATCHLIST) {
        return json({ error: `Watchlist is limited to ${MAX_WATCHLIST} pools.` }, 400)
      }

      unwrap(
        await db
          .from('watchlist')
          .upsert(
            poolIds.map((pool_id) => ({ user_id: session.userId, pool_id })),
            { onConflict: 'user_id,pool_id', ignoreDuplicates: true }
          ),
        'add to watchlist'
      )
      return json({ poolIds: await listIds(db, session.userId) })
    }

    if (request.method === 'DELETE') {
      const query = new URL(request.url).searchParams
      const body = (await readJson(request)) || {}
      const poolId = String(query.get('poolId') || body.poolId || '').trim()
      if (!POOL_ID_RE.test(poolId)) {
        return json({ error: 'Pool id is required.' }, 400)
      }
      unwrap(
        await db.from('watchlist').delete().eq('user_id', session.userId).eq('pool_id', poolId),
        'remove from watchlist'
      )
      return json({ poolIds: await listIds(db, session.userId) })
    }

    return methodNotAllowed()
  } catch (err) {
    console.error('watchlist error:', err.message)
    return json({ error: err.status ? err.message : 'Watchlist operation failed.' }, err.status || 500)
  }
}
