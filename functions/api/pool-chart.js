import { fetchJson } from './_lib/http.js'
import { json, methodNotAllowed } from './_lib/respond.js'

// Server-side proxy for DefiLlama pool APY/TVL history (drawer chart).
// Per-pool in-memory cache, 10-min TTL, bounded size; Cache-Control lets the
// Cloudflare edge cache each pool's history as well.
const POOL_ID_RE = /^[a-zA-Z0-9-]{1,64}$/
const TTL_MS = 10 * 60_000
const CACHE_CONTROL = 'public, max-age=60, s-maxage=600'
const MAX_CACHED_POOLS = 200

const cache = new Map() // poolId -> { points, expires }

export async function onRequest({ request }) {
  if (request.method !== 'GET') return methodNotAllowed()

  const poolId = String(new URL(request.url).searchParams.get('pool') || '').trim()
  if (!POOL_ID_RE.test(poolId)) {
    return json({ error: 'Query param "pool" is required.' }, 400)
  }

  const cached = cache.get(poolId)
  if (cached && cached.expires > Date.now()) {
    return json({ points: cached.points }, 200, { 'Cache-Control': CACHE_CONTROL })
  }

  try {
    const data = await fetchJson(`https://yields.llama.fi/chart/${encodeURIComponent(poolId)}`, {
      timeoutMs: 20_000,
    })
    const points = (data.data || [])
      .filter((d) => d.timestamp && d.apy != null)
      .map((d) => ({
        date: String(d.timestamp).slice(0, 10),
        apy: d.apy,
        tvlUsd: d.tvlUsd ?? null,
      }))

    if (cache.size >= MAX_CACHED_POOLS) {
      // drop the oldest entry — plenty for a 10-minute window
      cache.delete(cache.keys().next().value)
    }
    cache.set(poolId, { points, expires: Date.now() + TTL_MS })
    return json({ points }, 200, { 'Cache-Control': CACHE_CONTROL })
  } catch (err) {
    console.error('pool-chart proxy error:', err.message)
    if (cached) {
      return json({ points: cached.points }, 200, { 'Cache-Control': CACHE_CONTROL })
    }
    return json({ error: 'DefiLlama’s chart API didn’t respond for this pool.' }, 502)
  }
}
