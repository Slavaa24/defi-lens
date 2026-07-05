import { ChainBadge } from './PoolRow'
import { formatUsd, formatPercent, formatPrice, timeAgo } from '../utils/format'
import { clamp } from '../utils/validate'

// v3 full-range positions sit at (near) the min/max usable ticks
const FULL_RANGE_TICK = 887200

function Metric({ label, children, hint }) {
  return (
    <div title={hint}>
      <div className="text-[11px] uppercase tracking-wider text-txt-secondary mb-0.5">{label}</div>
      <div className="text-sm font-semibold">{children}</div>
    </div>
  )
}

function RangeBar({ snapshot, inRange, fullRange }) {
  if (fullRange) {
    return (
      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-accent-from/40 to-accent-to/40" />
        <div className="text-[11px] text-txt-secondary mt-1.5">Full range position</div>
      </div>
    )
  }

  const { priceLower, priceUpper, priceCurrent } = snapshot
  if (priceLower == null || priceUpper == null || priceCurrent == null || priceUpper <= priceLower) {
    return null
  }
  // log scale — v3 ranges are multiplicative
  const lo = Math.log(priceLower)
  const hi = Math.log(priceUpper)
  const cur = Math.log(priceCurrent)
  const pct = clamp(((cur - lo) / (hi - lo)) * 100, 2, 98)

  return (
    <div className="mt-4">
      <div className="relative h-1.5 rounded-full bg-edge">
        <div
          className={`absolute inset-y-0 left-0 right-0 rounded-full ${
            inRange ? 'bg-gradient-to-r from-accent-from/50 to-accent-to/50' : 'bg-negative/25'
          }`}
        />
        <div
          className={`absolute -top-[3px] w-[3px] h-3 rounded-full ${inRange ? 'bg-positive' : 'bg-negative'}`}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-txt-secondary mt-1.5 font-mono">
        <span>{formatPrice(priceLower)}</span>
        <span className={inRange ? 'text-txt-primary' : 'text-negative'}>
          {formatPrice(priceCurrent)}
        </span>
        <span>{formatPrice(priceUpper)}</span>
      </div>
    </div>
  )
}

export default function PositionCard({ position }) {
  const snap = position.last_snapshot || {}
  const feeTier = position.token0?.fee != null ? `${position.token0.fee / 10000}%` : null
  const pair = `${position.token0?.symbol ?? '?'} / ${position.token1?.symbol ?? '?'}`
  const fullRange =
    position.tick_lower <= -FULL_RANGE_TICK && position.tick_upper >= FULL_RANGE_TICK

  const il = snap.ilPct
  const ilColor = il == null ? '' : il < -0.005 ? 'text-negative' : 'text-positive'

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-semibold">{pair}</span>
          {feeTier && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-edge text-txt-secondary">
              {feeTier}
            </span>
          )}
          <ChainBadge chain={position.chain} />
        </div>
        <span
          className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full ${
            position.in_range
              ? 'bg-positive/10 text-positive'
              : 'bg-negative/10 text-negative'
          }`}
        >
          {position.in_range ? 'In range' : 'Out of range'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric
          label="Value"
          hint={snap.valueUsd == null ? 'No reliable USD price for one of the pool tokens.' : undefined}
        >
          {formatUsd(snap.valueUsd)}
        </Metric>
        <Metric
          label="IL vs entry"
          hint={
            il == null
              ? 'IL needs entry amounts and current USD prices for both tokens.'
              : 'Versus holding the amounts this position had when first tracked.'
          }
        >
          {il == null ? (
            '—'
          ) : (
            <span className={ilColor}>
              {formatPercent(il, { signed: true })}
              <span className="text-xs font-normal text-txt-secondary ml-1">
                ({formatUsd(snap.ilUsd)})
              </span>
            </span>
          )}
        </Metric>
        <Metric
          label="Uncollected fees"
          hint={
            snap.feesUsd == null
              ? 'Fee data could not be read reliably for this position.'
              : `${formatPrice(snap.feesToken0)} ${position.token0?.symbol} + ${formatPrice(snap.feesToken1)} ${position.token1?.symbol}`
          }
        >
          {snap.feesUsd == null ? '—' : formatUsd(snap.feesUsd)}
        </Metric>
        <Metric label="Age">{timeAgo(position.first_seen)}</Metric>
      </div>

      <RangeBar snapshot={snap} inRange={position.in_range} fullRange={fullRange} />
    </div>
  )
}
