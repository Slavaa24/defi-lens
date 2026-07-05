import { formatUsdCompact, formatPercent } from '../utils/format'

const chainColors = {
  Ethereum: 'bg-[#627eea]/15 text-[#8fa3f0]',
  Base: 'bg-[#0052ff]/15 text-[#5c8aff]',
  Arbitrum: 'bg-[#28a0f0]/15 text-[#5cb8f5]',
  Optimism: 'bg-[#ff0420]/15 text-[#ff6b7d]',
  Polygon: 'bg-[#8247e5]/15 text-[#a97df0]',
}

export function ChainBadge({ chain }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
        chainColors[chain] || 'bg-edge text-txt-secondary'
      }`}
    >
      {chain}
    </span>
  )
}

export default function PoolRow({ pool, starred, onToggleStar, onSelect }) {
  const apy7dTone =
    pool.apyPct7D == null ? 'text-zinc-600' : pool.apyPct7D >= 0 ? 'text-positive' : 'text-negative'

  const star = (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onToggleStar()
      }}
      className={`text-base leading-none transition-colors ${
        starred ? 'text-warning' : 'text-zinc-700 hover:text-zinc-400'
      }`}
      title={starred ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-label="Toggle watchlist"
    >
      {starred ? '★' : '☆'}
    </button>
  )

  return (
    <>
      {/* desktop row */}
      <div
        onClick={onSelect}
        className="hidden md:grid grid-cols-[24px_2fr_1.2fr_1fr_1fr_1fr_1fr] items-center gap-3 px-4 py-3 border-b border-edge/60 hover:bg-card/60 transition-colors cursor-pointer"
      >
        {star}
        <span className="font-medium text-sm truncate" title={pool.symbol}>
          {pool.symbol}
        </span>
        <span className="text-sm text-txt-secondary truncate">{pool.project}</span>
        <ChainBadge chain={pool.chain} />
        <span className="text-sm">{formatUsdCompact(pool.tvlUsd)}</span>
        <span className="text-sm font-semibold text-positive">
          {pool.apy != null ? formatPercent(pool.apy) : '—'}
        </span>
        <span className={`text-sm ${apy7dTone}`}>
          {pool.apyPct7D != null ? formatPercent(pool.apyPct7D, { signed: true }) : '—'}
        </span>
      </div>

      {/* mobile card */}
      <div onClick={onSelect} className="md:hidden card p-4 flex flex-col gap-2 cursor-pointer">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {star}
            <span className="font-medium text-sm truncate">{pool.symbol}</span>
          </div>
          <ChainBadge chain={pool.chain} />
        </div>
        <div className="flex items-center justify-between text-xs text-txt-secondary">
          <span className="truncate">{pool.project}</span>
          <span>TVL {formatUsdCompact(pool.tvlUsd)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-positive">
            {pool.apy != null ? `${formatPercent(pool.apy)} APY` : '— APY'}
          </span>
          <span className={apy7dTone}>
            7d {pool.apyPct7D != null ? formatPercent(pool.apyPct7D, { signed: true }) : '—'}
          </span>
        </div>
      </div>
    </>
  )
}
