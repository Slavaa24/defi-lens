import { fetchJson } from './http'

const BASE = 'https://api.coingecko.com/api/v3'

// Public (keyless) CoinGecko endpoints — fine for client-side free-tier usage.
export async function searchTokens(query) {
  if (!query || !query.trim()) return []
  const data = await fetchJson(`${BASE}/search?query=${encodeURIComponent(query.trim())}`)
  return (data.coins || []).slice(0, 8).map((c) => ({
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    thumb: c.thumb,
  }))
}

// ids: array of CoinGecko ids -> { [id]: priceUsd }
export async function getPrices(ids) {
  if (!ids || ids.length === 0) return {}
  const data = await fetchJson(
    `${BASE}/simple/price?ids=${ids.map(encodeURIComponent).join(',')}&vs_currencies=usd`
  )
  const out = {}
  for (const id of ids) out[id] = data[id]?.usd ?? null
  return out
}
