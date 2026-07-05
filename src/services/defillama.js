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
    apyBase: p.apyBase ?? null,
    apyReward: p.apyReward ?? null,
    apyPct7D: p.apyPct7D ?? null,
    ilRisk: p.ilRisk ?? null, // 'yes' | 'no'
    stablecoin: Boolean(p.stablecoin),
    poolMeta: p.poolMeta ?? null, // e.g. "0.05%" fee tier
  }))
}

// APY/TVL history for one pool (drawer chart).
export async function getPoolChart(poolId) {
  const data = await fetchJson(`https://yields.llama.fi/chart/${encodeURIComponent(poolId)}`)
  return (data.data || [])
    .filter((d) => d.timestamp && d.apy != null)
    .map((d) => ({
      date: String(d.timestamp).slice(0, 10),
      apy: d.apy,
      tvlUsd: d.tvlUsd ?? null,
    }))
}
