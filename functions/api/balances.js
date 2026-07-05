import { fetchJson } from './_lib/http.js'
import { getContractPrices, getEthPrice } from './_lib/prices.js'
import { json, methodNotAllowed } from './_lib/respond.js'

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const DUST_USD = 1
const METADATA_CAP = 50 // max token contracts we enrich per chain

const CHAINS = [
  { name: 'Ethereum', alchemy: 'eth-mainnet' },
  { name: 'Base', alchemy: 'base-mainnet' },
]

// naive in-memory guards — good enough per warm Workers isolate
const cache = new Map() // address -> { data, expires }
const rateBuckets = new Map() // ip -> { count, resetAt }
const CACHE_TTL_MS = 60_000
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 10 * 60_000

function rateLimited(ip) {
  const now = Date.now()
  const bucket = rateBuckets.get(ip)
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT
}

async function alchemyRpc(network, method, params, env) {
  const key = env.ALCHEMY_KEY
  const body = await fetchJson(`https://${network}.g.alchemy.com/v2/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (body.error) throw new Error(body.error.message || 'Alchemy RPC error')
  return body.result
}

async function chainBalances(chain, address, env) {
  const [nativeHex, tokenRes] = await Promise.all([
    alchemyRpc(chain.alchemy, 'eth_getBalance', [address, 'latest'], env),
    alchemyRpc(chain.alchemy, 'alchemy_getTokenBalances', [address, 'erc20'], env),
  ])

  const nonZero = (tokenRes.tokenBalances || [])
    .filter((t) => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
    .slice(0, METADATA_CAP)

  const metadata = await Promise.all(
    nonZero.map((t) =>
      alchemyRpc(chain.alchemy, 'alchemy_getTokenMetadata', [t.contractAddress], env).catch(() => null)
    )
  )

  const contracts = nonZero.map((t) => t.contractAddress.toLowerCase())
  const prices = await getContractPrices(chain.name, contracts, env)

  const tokens = []

  const nativeBalance = Number(BigInt(nativeHex)) / 1e18
  if (nativeBalance > 0) {
    tokens.push({
      chain: chain.name,
      contract: null,
      symbol: 'ETH',
      name: 'Ether',
      logo: null,
      balance: nativeBalance,
      priceUsd: null, // filled by caller (shared across chains)
      native: true,
    })
  }

  nonZero.forEach((t, i) => {
    const meta = metadata[i]
    if (!meta || meta.decimals == null) return
    const balance = Number(BigInt(t.tokenBalance)) / 10 ** meta.decimals
    if (!Number.isFinite(balance) || balance <= 0) return
    const price = prices[t.contractAddress.toLowerCase()] ?? null
    tokens.push({
      chain: chain.name,
      contract: t.contractAddress,
      symbol: meta.symbol || '?',
      name: meta.name || 'Unknown token',
      logo: meta.logo || null,
      balance,
      priceUsd: price,
      native: false,
    })
  })

  return tokens
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return methodNotAllowed()

  const ip =
    request.headers.get('cf-connecting-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown'
  if (rateLimited(ip)) {
    return json({ error: 'Too many requests — try again in a few minutes.' }, 429)
  }

  const address = String(new URL(request.url).searchParams.get('address') || '').trim()
  if (!ADDRESS_RE.test(address)) {
    return json({ error: 'Invalid address: expected 0x followed by 40 hex characters.' }, 400)
  }

  if (!env.ALCHEMY_KEY) {
    return json({ error: 'Server is not configured (missing RPC provider key).' }, 503)
  }

  const cacheKey = address.toLowerCase()
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return json(cached.data)
  }

  try {
    const [ethPrice, ...perChain] = await Promise.all([
      getEthPrice(env),
      ...CHAINS.map((c) => chainBalances(c, address, env)),
    ])

    let tokens = perChain.flat()
    for (const t of tokens) {
      if (t.native) t.priceUsd = ethPrice
      t.valueUsd = t.priceUsd != null ? t.balance * t.priceUsd : null
    }

    // hide dust and unpriced tokens (spam contracts have no CoinGecko price)
    tokens = tokens
      .filter((t) => t.valueUsd != null && t.valueUsd >= DUST_USD)
      .sort((a, b) => b.valueUsd - a.valueUsd)

    const totalUsd = tokens.reduce((sum, t) => sum + t.valueUsd, 0)
    const data = { address, tokens, totalUsd }

    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS })
    return json(data)
  } catch (err) {
    console.error('balances error:', err.message)
    return json({ error: 'Failed to fetch balances from upstream providers.' }, 502)
  }
}
