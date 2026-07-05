import { fetchJson } from './_lib/http.js'
import { json, methodNotAllowed } from './_lib/respond.js'

// Server-side proxy for DefiLlama's yields API: the direct client-side fetch
// is unreliable from some regions/ISPs. The parsed + trimmed list is cached
// per warm isolate for 10 minutes; Cache-Control lets the Cloudflare edge
// cache the response too, so most visitors never hit the origin function.
const TTL_MS = 10 * 60_000
const CACHE_CONTROL = 'public, max-age=60, s-maxage=600'

let cache = null // { pools, expires }

// Same field set the frontend used when it called DefiLlama directly —
// trimming server-side keeps the ~18k-pool payload small.
function mapPool(p) {
  return {
    id: p.pool,
    symbol: p.symbol,
    project: p.project,
    chain: p.chain,
    tvlUsd: p.tvlUsd ?? 0,
    apy: p.apy ?? null,
    apyBase: p.apyBase ?? null,
    apyReward: p.apyReward ?? null,
    apyPct1D: p.apyPct1D ?? null,
    apyPct7D: p.apyPct7D ?? null,
    apyPct30D: p.apyPct30D ?? null,
    ilRisk: p.ilRisk ?? null, // 'yes' | 'no'
    stablecoin: Boolean(p.stablecoin),
    poolMeta: p.poolMeta ?? null, // e.g. "0.05%" fee tier
    dataDays: p.count ?? null, // days of history DefiLlama has — low = newly listed
  }
}

export async function onRequest({ request }) {
  if (request.method !== 'GET') return methodNotAllowed()

  if (cache && cache.expires > Date.now()) {
    return json({ pools: cache.pools }, 200, { 'Cache-Control': CACHE_CONTROL })
  }

  try {
    // the /pools payload is several MB — give it more than the default 10s
    const data = await fetchJson('https://yields.llama.fi/pools', { timeoutMs: 30_000 })
    const pools = (data.data || []).map(mapPool)
    cache = { pools, expires: Date.now() + TTL_MS }
    return json({ pools }, 200, { 'Cache-Control': CACHE_CONTROL })
  } catch (err) {
    console.error('pools proxy error:', err.message)
    // serve stale data over an error if we have any
    if (cache) {
      return json({ pools: cache.pools }, 200, { 'Cache-Control': CACHE_CONTROL })
    }
    return json({ error: 'DefiLlama’s yields API didn’t respond — try again shortly.' }, 502)
  }
}
