import { fetchJson } from './http'

// DefiLlama data comes through our own /api proxies (functions/api/pools.js,
// functions/api/pool-chart.js): direct browser calls to yields.llama.fi are
// unreliable from some regions/ISPs. Field mapping happens server-side;
// React Query on top of these keeps its existing caching (10-min staleTime).

// Full pools list. Shape per pool:
// { id, symbol, project, chain, tvlUsd, apy, apyBase, apyReward,
//   apyPct1D/7D/30D, ilRisk, stablecoin, poolMeta, dataDays }
export async function getPools() {
  const data = await fetchJson('/api/pools')
  return data.pools || []
}

// APY/TVL history for one pool (drawer chart): [{ date, apy, tvlUsd }]
export async function getPoolChart(poolId) {
  const data = await fetchJson(`/api/pool-chart?pool=${encodeURIComponent(poolId)}`)
  return data.points || []
}
