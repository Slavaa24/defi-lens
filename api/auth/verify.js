import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { parseSiweMessage, validateSiweMessage } from 'viem/siwe'
import { getDb, unwrap } from '../_lib/db.js'
import { createSessionToken, sessionCookie } from '../_lib/auth.js'

// Universal signature verification (EOA + ERC-1271 smart wallets + ERC-6492)
// needs an RPC; signatures themselves are chain-agnostic, mainnet suffices.
function verifyClient() {
  const key = process.env.ALCHEMY_KEY
  return createPublicClient({
    chain: mainnet,
    transport: http(key ? `https://eth-mainnet.g.alchemy.com/v2/${key}` : undefined),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, signature } = req.body || {}
  if (typeof message !== 'string' || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Expected { message, signature }.' })
  }

  try {
    const db = getDb()
    const fields = parseSiweMessage(message)

    if (!fields.address || !fields.nonce) {
      return res.status(400).json({ error: 'Malformed SIWE message.' })
    }
    const expectedDomain = (req.headers.host || '').toLowerCase()
    const valid = validateSiweMessage({
      message: fields,
      domain: expectedDomain,
      time: new Date(),
    })
    if (!valid) {
      return res.status(401).json({ error: 'SIWE message failed validation (domain/time).' })
    }

    // Nonce must exist, be unexpired, and is single-use.
    const nonceRow = unwrap(
      await db.from('siwe_nonces').delete().eq('nonce', fields.nonce).select().maybeSingle(),
      'consume nonce'
    )
    if (!nonceRow || new Date(nonceRow.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Nonce is invalid or expired — try signing in again.' })
    }

    const signatureOk = await verifyClient().verifyMessage({
      address: fields.address,
      message,
      signature,
    })
    if (!signatureOk) {
      return res.status(401).json({ error: 'Signature verification failed.' })
    }

    const address = fields.address.toLowerCase()
    const user = unwrap(
      await db
        .from('users')
        .upsert({ address }, { onConflict: 'address', ignoreDuplicates: false })
        .select()
        .single(),
      'upsert user'
    )

    const token = await createSessionToken({ userId: user.id, address })
    res.setHeader('Set-Cookie', sessionCookie(token))
    return res.status(200).json({
      address,
      plan: user.plan,
      pro_until: user.pro_until,
      telegram_linked: user.telegram_chat_id != null,
    })
  } catch (err) {
    console.error('verify error:', err.message)
    return res.status(err.status || 500).json({ error: err.status ? err.message : 'Sign-in failed.' })
  }
}
