import { useEffect } from 'react'
import { ChainBadge } from './PoolRow'
import { formatUsdCompact, formatPercent } from '../utils/format'

function deltaTone(v) {
  return v == null ? 'text-zinc-600' : v >= 0 ? 'text-positive' : 'text-negative'
}

// Metric rows for the comparison table: [label, render(pool)]
const METRICS = [
  ['TVL', (p) => formatUsdCompact(p.tvlUsd)],
  [
    'APY',
    (p) => (
      <span className="text-positive font-semibold">
        {p.apy != null ? formatPercent(p.apy) : '—'}
      </span>
    ),
  ],
  ['Base APY', (p) => (p.apyBase != null ? formatPercent(p.apyBase) : '—')],
  ['Reward APY', (p) => (p.apyReward != null ? formatPercent(p.apyReward) : '—')],
  [
    '7d APY trend',
    (p) => (
      <span className={deltaTone(p.apyPct7D)}>
        {p.apyPct7D != null ? formatPercent(p.apyPct7D, { signed: true }) : '—'}
      </span>
    ),
  ],
  [
    '30d APY trend',
    (p) => (
      <span className={deltaTone(p.apyPct30D)}>
        {p.apyPct30D != null ? formatPercent(p.apyPct30D, { signed: true }) : '—'}
      </span>
    ),
  ],
  [
    'IL risk',
    (p) =>
      p.ilRisk === 'yes' ? (
        <span className="text-warning">Yes</span>
      ) : p.ilRisk === 'no' ? (
        <span className="text-positive">No</span>
      ) : (
        '—'
      ),
  ],
  ['Stablecoin pair', (p) => (p.stablecoin ? <span className="text-positive">Yes</span> : 'No')],
]

// Sticky bottom bar shown while pools are checked for comparison.
export function CompareBar({ count, onCompare, onClear }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 card px-4 py-2.5 flex items-center gap-4 shadow-2xl border-accent-from/40">
      <span className="text-sm text-txt-secondary whitespace-nowrap">
        {count} pool{count === 1 ? '' : 's'} selected
      </span>
      <button className="btn-primary py-1.5 px-4" onClick={onCompare} disabled={count < 2}>
        Compare
      </button>
      <button
        className="text-xs text-txt-secondary hover:text-txt-primary transition-colors"
        onClick={onClear}
      >
        Clear
      </button>
    </div>
  )
}

// Full-screen comparison of 2–4 pools: metrics as rows, pools as columns.
export default function PoolCompare({ pools, onClose }) {
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

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Compare pools">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-[8vh] max-h-[84vh] w-auto sm:w-[min(56rem,92vw)] card bg-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
          <h2 className="font-bold">Compare pools</h2>
          <button
            onClick={onClose}
            className="text-txt-secondary hover:text-txt-primary text-xl leading-none px-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-edge">
                <th className="text-left font-medium text-txt-secondary px-5 py-3 w-36">Metric</th>
                {pools.map((p) => (
                  <th key={p.id} className="text-left px-4 py-3 align-top">
                    <div className="font-semibold truncate max-w-[180px]" title={p.symbol}>
                      {p.symbol}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-txt-secondary font-normal truncate max-w-[120px]">
                        {p.project}
                      </span>
                      <ChainBadge chain={p.chain} />
                    </div>
                    {p.poolMeta && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-edge text-txt-secondary font-normal">
                        {p.poolMeta}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map(([label, render]) => (
                <tr key={label} className="border-b border-edge/60 last:border-0">
                  <td className="px-5 py-2.5 text-txt-secondary">{label}</td>
                  {pools.map((p) => (
                    <td key={p.id} className="px-4 py-2.5">
                      {render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
