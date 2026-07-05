import { getDb, unwrap } from './_lib/db.js'
import { getSession, unauthorized } from './_lib/auth.js'
import { json, readJson, methodNotAllowed } from './_lib/respond.js'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const MAX_WALLETS = 5
const MAX_LABEL = 40

export async function onRequest({ request, env }) {
  const session = await getSession(request, env)
  if (!session) return unauthorized()

  try {
    const db = getDb(env)

    if (request.method === 'GET') {
      const wallets = unwrap(
        await db
          .from('wallets')
          .select('id, address, label, created_at')
          .eq('user_id', session.userId)
          .order('created_at'),
        'list wallets'
      )
      return json({ wallets, max: MAX_WALLETS })
    }

    if (request.method === 'POST') {
      const body = (await readJson(request)) || {}
      const address = String(body.address || '').trim().toLowerCase()
      const label = String(body.label || '').trim().slice(0, MAX_LABEL) || null
      if (!ADDRESS_RE.test(address)) {
        return json({ error: 'Invalid address: expected 0x followed by 40 hex characters.' }, 400)
      }

      const { count } = await db
        .from('wallets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.userId)
      if ((count ?? 0) >= MAX_WALLETS) {
        return json({ error: `You can track up to ${MAX_WALLETS} wallets. Remove one first.` }, 400)
      }

      const { data, error } = await db
        .from('wallets')
        .insert({ user_id: session.userId, address, label })
        .select('id, address, label, created_at')
        .single()
      if (error) {
        if (error.code === '23505') {
          return json({ error: 'This wallet is already on your list.' }, 409)
        }
        throw new Error(`add wallet: ${error.message}`)
      }
      return json({ wallet: data }, 201)
    }

    if (request.method === 'DELETE') {
      const query = new URL(request.url).searchParams
      const body = (await readJson(request)) || {}
      const id = String(query.get('id') || body.id || '').trim()
      if (!id) return json({ error: 'Wallet id is required.' }, 400)
      // cascades to positions via FK
      const deleted = unwrap(
        await db.from('wallets').delete().eq('id', id).eq('user_id', session.userId).select('id'),
        'delete wallet'
      )
      if (!deleted.length) return json({ error: 'Wallet not found.' }, 404)
      return json({ ok: true })
    }

    return methodNotAllowed()
  } catch (err) {
    console.error('wallets error:', err.message)
    return json({ error: err.status ? err.message : 'Wallet operation failed.' }, err.status || 500)
  }
}
