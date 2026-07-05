import { getDb, unwrap } from '../_lib/db.js'
import { getSession, unauthorized } from '../_lib/auth.js'
import { json, methodNotAllowed } from '../_lib/respond.js'

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return methodNotAllowed()
  const session = await getSession(request, env)
  if (!session) return unauthorized()

  try {
    const user = unwrap(
      await getDb(env).from('users').select().eq('id', session.userId).maybeSingle(),
      'load user'
    )
    if (!user) {
      // token refers to a deleted user — treat as signed out
      return unauthorized()
    }
    return json({
      address: user.address,
      plan: user.plan,
      pro_until: user.pro_until,
      telegram_linked: user.telegram_chat_id != null,
    })
  } catch (err) {
    console.error('me error:', err.message)
    return json({ error: err.status ? err.message : 'Failed to load session.' }, err.status || 500)
  }
}
