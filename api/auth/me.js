import { getDb, unwrap } from '../_lib/db.js'
import { requireSession } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const session = await requireSession(req, res)
  if (!session) return

  try {
    const user = unwrap(
      await getDb().from('users').select().eq('id', session.userId).maybeSingle(),
      'load user'
    )
    if (!user) {
      // token refers to a deleted user — treat as signed out
      return res.status(401).json({ error: 'Sign in required' })
    }
    return res.status(200).json({
      address: user.address,
      plan: user.plan,
      pro_until: user.pro_until,
      telegram_linked: user.telegram_chat_id != null,
    })
  } catch (err) {
    console.error('me error:', err.message)
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to load session.' })
  }
}
