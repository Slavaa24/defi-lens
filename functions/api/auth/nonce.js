import { generateSiweNonce } from 'viem/siwe'
import { getDb, unwrap } from '../_lib/db.js'
import { json, methodNotAllowed } from '../_lib/respond.js'

const TTL_MS = 5 * 60_000

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return methodNotAllowed()
  try {
    const db = getDb(env)
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
    return json({ nonce })
  } catch (err) {
    console.error('nonce error:', err.message)
    return json({ error: err.status ? err.message : 'Failed to issue nonce.' }, err.status || 500)
  }
}
