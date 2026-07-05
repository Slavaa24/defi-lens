import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { parseSiweMessage, validateSiweMessage } from 'viem/siwe'
import { getDb, unwrap } from '../_lib/db.js'
import { createSessionToken, sessionCookie } from '../_lib/auth.js'
import { json, readJson, methodNotAllowed } from '../_lib/respond.js'

// Universal signature verification (EOA + ERC-1271 smart wallets + ERC-6492)
// needs an RPC; signatures themselves are chain-agnostic, mainnet suffices.
function verifyClient(env) {
  const key = env.ALCHEMY_KEY
  return createPublicClient({
    chain: mainnet,
    transport: http(key ? `https://eth-mainnet.g.alchemy.com/v2/${key}` : undefined),
  })
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return methodNotAllowed()

  const { message, signature } = (await readJson(request)) || {}
  if (typeof message !== 'string' || typeof signature !== 'string') {
    return json({ error: 'Expected { message, signature }.' }, 400)
  }

  try {
    const db = getDb(env)
    const fields = parseSiweMessage(message)

    if (!fields.address || !fields.nonce) {
      return json({ error: 'Malformed SIWE message.' }, 400)
    }
    const expectedDomain = new URL(request.url).host.toLowerCase()
    const valid = validateSiweMessage({
      message: fields,
      domain: expectedDomain,
      time: new Date(),
    })
    if (!valid) {
      return json({ error: 'SIWE message failed validation (domain/time).' }, 401)
    }

    // Nonce must exist, be unexpired, and is single-use.
    const nonceRow = unwrap(
      await db.from('siwe_nonces').delete().eq('nonce', fields.nonce).select().maybeSingle(),
      'consume nonce'
    )
    if (!nonceRow || new Date(nonceRow.expires_at) < new Date()) {
      return json({ error: 'Nonce is invalid or expired — try signing in again.' }, 401)
    }

    const signatureOk = await verifyClient(env).verifyMessage({
      address: fields.address,
      message,
      signature,
    })
    if (!signatureOk) {
      return json({ error: 'Signature verification failed.' }, 401)
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

    const token = await createSessionToken(env, { userId: user.id, address })
    return json(
      {
        address,
        plan: user.plan,
        pro_until: user.pro_until,
        telegram_linked: user.telegram_chat_id != null,
      },
      200,
      { 'Set-Cookie': sessionCookie(token, request) }
    )
  } catch (err) {
    console.error('verify error:', err.message)
    return json({ error: err.status ? err.message : 'Sign-in failed.' }, err.status || 500)
  }
}
