import { generateSiweNonce } from 'viem/siwe'
import { getDb, unwrap } from '../_lib/db.js'

const TTL_MS = 5 * 60_000

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const db = getDb()
    const nonce = generateSiweNonce()
    unwrap(
      await db.from('siwe_nonces').insert({
        nonce,
        expires_at: new Date(Date.now() + TTL_MS).toISOString(),
      }),
      'store nonce'
    )
    // opportunistic cleanup of expired nonces; failure is harmless
    await db.from('siwe_nonces').delete().lt('expires_at', new Date().toISOString())
    return res.status(200).json({ nonce })
  } catch (err) {
    console.error('nonce error:', err.message)
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'Failed to issue nonce.' })
  }
}
