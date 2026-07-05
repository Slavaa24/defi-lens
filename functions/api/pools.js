import { fetchJson } from './_lib/http.js'
import { json, methodNotAllowed } from './_lib/respond.js'

// Server-side proxy for DefiLlama's yields API: the direct client-side fetch
// is unreliable from some regions/ISPs, and the raw payload is several MB.
//
// Caching layers (a cold upstream fetch can take ~30s):
//   1. per-isolate memory (10 min)
//   2. Cloudflare Cache API (caches.default) keyed on the request URL, so one
//      completed fetch serves every visitor hitting the same edge
//   3. the fetch + cache fill run under context.waitUntil, so they finish and
//      populate both caches even if the initiating client disconnects
// Concurrent cold requests share one in-flight upstream fetch per isolate.
const TTL_MS = 10 * 60_000
const CACHE_CONTROL = 'public, max-age=60, s-maxage=600'

let memCache = null // { pools, expires }
let inflight = null // Promise<pools> shared by concurrent cold requests

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

function poolsResponse(pools) {
  return json({ pools }, 200, { 'Cache-Control': CACHE_CONTROL })
}

export async function onRequest({ request, waitUntil }) {
  if (request.method !== 'GET') return methodNotAllowed()

  if (memCache && memCache.expires > Date.now()) {
    return poolsResponse(memCache.pools)
  }

  const cacheUrl = new URL(request.url)
  cacheUrl.search = ''
  const cacheKey = new Request(cacheUrl.toString())
  const edge = caches.default

  const edgeHit = await edge.match(cacheKey)
  if (edgeHit) return edgeHit

  if (!inflight) {
    const promise = (async () => {
      // the /pools payload is several MB — give it more than the default 10s
      const data = await fetchJson('https://yields.llama.fi/pools', {
        timeoutMs: 30_000,
        retries: 0,
      })
      const pools = (data.data || []).map(mapPool)
      memCache = { pools, expires: Date.now() + TTL_MS }
      await edge.put(cacheKey, poolsResponse(pools))
      return pools
    })()
    promise.finally(() => {
      if (inflight === promise) inflight = null
    })
    inflight = promise
  }

  // keep the fetch + cache fill alive even if this client disconnects
  waitUntil(inflight.catch(() => {}))

  try {
    return poolsResponse(await inflight)
  } catch (err) {
    console.error('pools proxy error:', err.message)
    // serve stale data over an error if we have any
    if (memCache) return poolsResponse(memCache.pools)
    return json({ error: 'DefiLlama’s yields API didn’t respond — try again shortly.' }, 502)
  }
}
