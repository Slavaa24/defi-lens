import { getDb, unwrap } from '../_lib/db.js'
import { getSession, unauthorized } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/respond.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_DAYS = 365

// GET /api/positions/history?positionId= — daily snapshots for one position
// the signed-in user owns (via positions → wallets → user_id).
export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return methodNotAllowed()
  const session = await getSession(request, env)
  if (!session) return unauthorized()

  const positionId = String(new URL(request.url).searchParams.get('positionId') || '').trim()
  if (!UUID_RE.test(positionId)) {
    return json({ error: 'positionId is required.' }, 400)
  }

  try {
    const db = getDb(env)

    const owned = unwrap(
      await db
        .from('positions')
        .select('id, wallets!inner(user_id)')
        .eq('id', positionId)
        .eq('wallets.user_id', session.userId)
        .maybeSingle(),
      'check position ownership'
    )
    if (!owned) return json({ error: 'Position not found.' }, 404)

    const snapshots = unwrap(
      await db
        .from('position_snapshots')
        .select('day, value_usd, il_pct, il_usd, fees_usd, in_range')
        .eq('position_id', positionId)
        .order('day', { ascending: true })
        .limit(MAX_DAYS),
      'load snapshots'
    )
    return json({ snapshots })
  } catch (err) {
    console.error('history error:', err.message)
    return json({ error: err.status ? err.message : 'Failed to load position history.' }, err.status || 500)
  }
}
