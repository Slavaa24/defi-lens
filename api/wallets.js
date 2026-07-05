import { getDb, unwrap } from './_lib/db.js'
import { requireSession } from './_lib/auth.js'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const MAX_WALLETS = 5
const MAX_LABEL = 40

export default async function handler(req, res) {
  const session = await requireSession(req, res)
  if (!session) return

  try {
    const db = getDb()

    if (req.method === 'GET') {
      const wallets = unwrap(
        await db
          .from('wallets')
          .select('id, address, label, created_at')
          .eq('user_id', session.userId)
          .order('created_at'),
        'list wallets'
      )
      return res.status(200).json({ wallets, max: MAX_WALLETS })
    }

    if (req.method === 'POST') {
      const address = String(req.body?.address || '').trim().toLowerCase()
      const label = String(req.body?.label || '').trim().slice(0, MAX_LABEL) || null
      if (!ADDRESS_RE.test(address)) {
        return res.status(400).json({ error: 'Invalid address: expected 0x followed by 40 hex characters.' })
      }

      const { count } = await db
        .from('wallets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.userId)
      if ((count ?? 0) >= MAX_WALLETS) {
        return res.status(400).json({ error: `You can track up to ${MAX_WALLETS} wallets. Remove one first.` })
      }

      const { data, error } = await db
        .from('wallets')
        .insert({ user_id: session.userId, address, label })
        .select('id, address, label, created_at')
        .single()
      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'This wallet is already on your list.' })
        }
        throw new Error(`add wallet: ${error.message}`)
      }
      return res.status(201).json({ wallet: data })
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || req.body?.id || '').trim()
      if (!id) return res.status(400).json({ error: 'Wallet id is required.' })
      // cascades to positions via FK
      const deleted = unwrap(
        await db.from('wallets').delete().eq('id', id).eq('user_id', session.userId).select('id'),
        'delete wallet'
      )
      if (!deleted.length) return res.status(404).json({ error: 'Wallet not found.' })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('wallets error:', err.message)
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'Wallet operation failed.' })
  }
}
