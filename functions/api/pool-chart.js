import { fetchJson } from './_lib/http.js'
import { json, methodNotAllowed } from './_lib/respond.js'

// Server-side proxy for DefiLlama pool APY/TVL history (drawer chart).
// Same resilience pattern as /api/pools: per-isolate memory cache, Cloudflare
// Cache API for cross-visitor reuse, and the upstream fetch + cache fill kept
// alive via context.waitUntil so a client abort can't waste the work.
const POOL_ID_RE = /^[a-zA-Z0-9-]{1,64}$/
const TTL_MS = 10 * 60_000
const CACHE_CONTROL = 'public, max-age=60, s-maxage=600'
const MAX_CACHED_POOLS = 200

const memCache = new Map() // poolId -> { points, expires }
const inflight = new Map() // poolId -> Promise<points>

function chartResponse(points) {
  return json({ points }, 200, { 'Cache-Control': CACHE_CONTROL })
}

export async function onRequest({ request, waitUntil }) {
  if (request.method !== 'GET') return methodNotAllowed()

  const poolId = String(new URL(request.url).searchParams.get('pool') || '').trim()
  if (!POOL_ID_RE.test(poolId)) {
    return json({ error: 'Query param "pool" is required.' }, 400)
  }

  const cached = memCache.get(poolId)
  if (cached && cached.expires > Date.now()) {
    return chartResponse(cached.points)
  }

  const cacheUrl = new URL(request.url)
  cacheUrl.search = `?pool=${encodeURIComponent(poolId)}`
  const cacheKey = new Request(cacheUrl.toString())
  const edge = caches.default

  const edgeHit = await edge.match(cacheKey)
  if (edgeHit) return edgeHit

  if (!inflight.has(poolId)) {
    const promise = (async () => {
      const data = await fetchJson(`https://yields.llama.fi/chart/${encodeURIComponent(poolId)}`, {
        timeoutMs: 20_000,
        retries: 0,
      })
      const points = (data.data || [])
        .filter((d) => d.timestamp && d.apy != null)
        .map((d) => ({
          date: String(d.timestamp).slice(0, 10),
          apy: d.apy,
          tvlUsd: d.tvlUsd ?? null,
        }))

      if (memCache.size >= MAX_CACHED_POOLS) {
        // drop the oldest entry — plenty for a 10-minute window
        memCache.delete(memCache.keys().next().value)
      }
      memCache.set(poolId, { points, expires: Date.now() + TTL_MS })
      await edge.put(cacheKey, chartResponse(points))
      return points
    })()
    promise.finally(() => {
      if (inflight.get(poolId) === promise) inflight.delete(poolId)
    })
    inflight.set(poolId, promise)
  }

  const promise = inflight.get(poolId)
  // keep the fetch + cache fill alive even if this client disconnects
  waitUntil(promise.catch(() => {}))

  try {
    return chartResponse(await promise)
  } catch (err) {
    console.error('pool-chart proxy error:', err.message)
    if (cached) return chartResponse(cached.points)
    return json({ error: 'DefiLlama’s chart API didn’t respond for this pool.' }, 502)
  }
}
