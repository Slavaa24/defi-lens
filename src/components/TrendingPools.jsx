import { useMemo } from 'react'
import { ChainBadge } from './PoolRow'
import { formatUsdCompact, formatPercent } from '../utils/format'

const MIN_TVL = 1_000_000
const NEW_POOL_MAX_DAYS = 7 // ≤ this many days of DefiLlama history = newly listed
const PER_SECTION = 3

function Row({ pool, right, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-bg transition-colors text-left"
    >
      <span className="min-w-0 flex items-center gap-2">
        <span className="text-sm font-medium truncate">{pool.symbol}</span>
        <ChainBadge chain={pool.chain} />
      </span>
      {right}
    </button>
  )
}

// "Market movers" derived from the already-loaded pools dataset:
// biggest 24h APY moves and freshly listed pools, all with TVL > $1M.
export default function TrendingPools({ pools, onSelect }) {
  const { gainers, losers, fresh } = useMemo(() => {
    const eligible = pools.filter((p) => p.tvlUsd >= MIN_TVL && p.apy != null)
    const withDelta = eligible.filter((p) => p.apyPct1D != null)
    const byDelta = [...withDelta].sort((a, b) => b.apyPct1D - a.apyPct1D)
    return {
      gainers: byDelta.slice(0, PER_SECTION).filter((p) => p.apyPct1D > 0),
      losers: byDelta
        .slice(-PER_SECTION)
        .reverse()
        .filter((p) => p.apyPct1D < 0),
      fresh: eligible
        .filter((p) => p.dataDays != null && p.dataDays <= NEW_POOL_MAX_DAYS)
        .sort((a, b) => b.tvlUsd - a.tvlUsd)
        .slice(0, PER_SECTION),
    }
  }, [pools])

  const sections = [
    {
      title: '🔥 APY gainers · 24h',
      items: gainers,
      right: (p) => (
        <span className="text-sm text-positive font-semibold shrink-0">
          {formatPercent(p.apyPct1D, { signed: true })}
        </span>
      ),
    },
    {
      title: '📉 APY losers · 24h',
      items: losers,
      right: (p) => (
        <span className="text-sm text-negative font-semibold shrink-0">
          {formatPercent(p.apyPct1D, { signed: true })}
        </span>
      ),
    },
    {
      title: '🆕 New pools · TVL > $1M',
      items: fresh,
      right: (p) => (
        <span className="text-sm text-txt-secondary shrink-0">{formatUsdCompact(p.tvlUsd)}</span>
      ),
    },
  ].filter((s) => s.items.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {sections.map((s) => (
        <div key={s.title} className="card p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-txt-secondary px-2 mb-2">
            {s.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {s.items.map((p) => (
              <Row key={p.id} pool={p} right={s.right(p)} onSelect={() => onSelect(p)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
