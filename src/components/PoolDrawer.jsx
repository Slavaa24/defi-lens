import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { getPoolChart } from '../services/defillama'
import { formatUsdCompact, formatPercent } from '../utils/format'
import { ChainBadge } from './PoolRow'
import Skeleton from './Skeleton'
import ErrorState from './ErrorState'

const CHART_DAYS = 90

function Stat({ label, value, tone = '' }) {
  return (
    <div className="rounded-lg bg-bg border border-edge px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-txt-secondary mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

// Right-side detail drawer for a pool. Closes on backdrop click, ✕ or Esc.
export default function PoolDrawer({ pool, starred, onToggleStar, onClose }) {
  const chart = useQuery({
    queryKey: ['pool-chart', pool.id],
    queryFn: () => getPoolChart(pool.id),
    staleTime: 10 * 60 * 1000,
  })

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const points = (chart.data || []).slice(-CHART_DAYS)
  const apy7dTone =
    pool.apyPct7D == null ? '' : pool.apyPct7D >= 0 ? 'text-positive' : 'text-negative'

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${pool.symbol} details`}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-edge overflow-y-auto">
        <div className="p-5 flex flex-col gap-5">
          {/* header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold truncate">{pool.symbol}</h2>
                {pool.poolMeta && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-edge text-txt-secondary">
                    {pool.poolMeta}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-txt-secondary">
                <span className="truncate">{pool.project}</span>
                <ChainBadge chain={pool.chain} />
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onToggleStar}
                className={`text-xl leading-none px-1.5 py-1 transition-colors ${
                  starred ? 'text-warning' : 'text-zinc-700 hover:text-zinc-400'
                }`}
                title={starred ? 'Remove from watchlist' : 'Add to watchlist'}
                aria-label="Toggle watchlist"
              >
                {starred ? '★' : '☆'}
              </button>
              <button
                onClick={onClose}
                className="text-txt-secondary hover:text-txt-primary text-xl leading-none px-1.5 py-1 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="TVL" value={formatUsdCompact(pool.tvlUsd)} />
            <Stat
              label="APY"
              value={pool.apy != null ? formatPercent(pool.apy) : '—'}
              tone="text-positive"
            />
            <Stat
              label="Base / Reward APY"
              value={`${pool.apyBase != null ? formatPercent(pool.apyBase) : '—'} / ${
                pool.apyReward != null ? formatPercent(pool.apyReward) : '—'
              }`}
            />
            <Stat
              label="7d APY Δ"
              value={pool.apyPct7D != null ? formatPercent(pool.apyPct7D, { signed: true }) : '—'}
              tone={apy7dTone}
            />
            <Stat
              label="IL risk"
              value={pool.ilRisk === 'yes' ? 'Yes' : pool.ilRisk === 'no' ? 'No' : '—'}
              tone={pool.ilRisk === 'yes' ? 'text-warning' : pool.ilRisk === 'no' ? 'text-positive' : ''}
            />
            <Stat label="Type" value={pool.stablecoin ? 'Stablecoin pool' : 'Volatile pair'} />
          </div>

          {/* APY history */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              APY history <span className="text-txt-secondary font-normal">(last {CHART_DAYS} days)</span>
            </h3>

            {chart.isLoading && <Skeleton className="h-[220px]" />}

            {chart.isError && (
              <ErrorState
                title="Couldn’t load APY history"
                message="DefiLlama’s chart API didn’t respond for this pool."
                onRetry={chart.refetch}
              />
            )}

            {!chart.isLoading && !chart.isError && points.length === 0 && (
              <div className="rounded-lg bg-bg border border-edge p-6 text-center text-sm text-txt-secondary">
                No APY history available for this pool yet.
              </div>
            )}

            {!chart.isLoading && !chart.isError && points.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={points} margin={{ top: 5, right: 5, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="apyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    tickFormatter={(d) => d.slice(5)}
                    stroke="#1f1f1f"
                    minTickGap={40}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                    stroke="#1f1f1f"
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#111111',
                      border: '1px solid #1f1f1f',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v, name) =>
                      name === 'apy' ? [formatPercent(v), 'APY'] : [formatUsdCompact(v), 'TVL']
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="apy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#apyFill)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <a
            href={`https://defillama.com/yields/pool/${encodeURIComponent(pool.id)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            View on DefiLlama ↗
          </a>
        </div>
      </aside>
    </div>
  )
}
