import { useQuery } from '@tanstack/react-query'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { apiFetch } from '../services/api'
import { formatUsd, formatPercent, formatUsdCompact } from '../utils/format'
import Skeleton from './Skeleton'

// Value & IL history for one position, fed by daily refresh snapshots.
export default function PositionHistory({ positionId }) {
  const history = useQuery({
    queryKey: ['position-history', positionId],
    queryFn: () => apiFetch(`/api/positions/history?positionId=${positionId}`),
    staleTime: 5 * 60 * 1000,
  })

  if (history.isLoading) return <Skeleton className="h-[200px] mt-4" />

  if (history.isError) {
    return (
      <div className="mt-4 rounded-lg bg-bg border border-edge p-4 text-center">
        <p className="text-sm text-txt-secondary mb-2">Couldn’t load history.</p>
        <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => history.refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const points = (history.data?.snapshots || []).map((s) => ({
    day: s.day,
    value: s.value_usd,
    ilPct: s.il_pct,
  }))

  if (points.length < 2) {
    return (
      <div className="mt-4 rounded-lg bg-bg border border-edge p-4 text-sm text-txt-secondary">
        {points.length === 0
          ? 'No history yet — a snapshot is stored every time positions refresh.'
          : 'One snapshot so far — the chart appears after the next refresh on a later day.'}{' '}
        Daily automatic snapshots arrive with alerts (Phase 3).
      </div>
    )
  }

  return (
    <div className="mt-4">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={points} margin={{ top: 5, right: -8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickFormatter={(d) => d.slice(5)}
            stroke="#1f1f1f"
            minTickGap={36}
          />
          <YAxis
            yAxisId="usd"
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickFormatter={(v) => formatUsdCompact(v)}
            stroke="#1f1f1f"
            width={56}
          />
          <YAxis
            yAxisId="il"
            orientation="right"
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
            stroke="#1f1f1f"
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: '#111111',
              border: '1px solid #1f1f1f',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v, name) =>
              name === 'value' ? [formatUsd(v), 'Value'] : [formatPercent(v, { signed: true }), 'IL']
            }
          />
          <Area
            yAxisId="usd"
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#3b82f6"
            fillOpacity={0.12}
            dot={points.length < 10}
            isAnimationActive={false}
          />
          <Line
            yAxisId="il"
            type="monotone"
            dataKey="ilPct"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={points.length < 10}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-txt-secondary mt-1.5">
        <span className="text-accent-from">■</span> Value (USD) ·{' '}
        <span className="text-negative">■</span> IL % — one point per day a refresh ran.
      </p>
    </div>
  )
}
