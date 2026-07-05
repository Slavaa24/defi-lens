import { fetchJson } from './http'

// Full pools list from DefiLlama yields API. Cached by React Query (10 min).
export async function getPools() {
  const data = await fetchJson('https://yields.llama.fi/pools')
  return (data.data || []).map((p) => ({
    id: p.pool,
    symbol: p.symbol,
    project: p.project,
    chain: p.chain,
    tvlUsd: p.tvlUsd ?? 0,
    apy: p.apy ?? null,
    apyPct7D: p.apyPct7D ?? null,
  }))
}
