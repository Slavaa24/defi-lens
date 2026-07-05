import { useMemo, useState } from 'react'
import usePools from '../hooks/usePools'
import useDebounce from '../hooks/useDebounce'
import useWatchlist from '../hooks/useWatchlist'
import useDocumentTitle from '../hooks/useDocumentTitle'
import PoolRow from '../components/PoolRow'
import PoolDrawer from '../components/PoolDrawer'
import PoolCompare, { CompareBar } from '../components/PoolCompare'
import TrendingPools from '../components/TrendingPools'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import { parseNumber } from '../utils/validate'

const CHAINS = ['All', 'Base', 'Ethereum', 'Arbitrum', 'Optimism', 'Polygon']
const SUPPORTED = CHAINS.slice(1)
const PAGE_SIZE = 50
const COMPARE_MAX = 4

export default function Pools() {
  useDocumentTitle('Pools Explorer')
  const { data: pools, isLoading, isError, refetch } = usePools()
  const { watchlist, toggle: toggleStar } = useWatchlist()

  const [chain, setChain] = useState('All')
  const [search, setSearch] = useState('')
  const [minApy, setMinApy] = useState('')
  const [minTvl, setMinTvl] = useState('')
  const [sortBy, setSortBy] = useState('tvl')
  const [onlyStarred, setOnlyStarred] = useState(false)
  const [onlyStable, setOnlyStable] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState(null) // pool object for the drawer
  const [compareIds, setCompareIds] = useState([]) // 2-4 pool ids to compare
  const [comparing, setComparing] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const supportedPools = useMemo(
    () => (pools || []).filter((p) => SUPPORTED.includes(p.chain)),
    [pools]
  )

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const apyFloor = parseNumber(minApy, 0)
    const tvlFloor = parseNumber(minTvl, 0)
    return supportedPools
      .filter((p) => chain === 'All' || p.chain === chain)
      .filter(
        (p) =>
          !q ||
          p.symbol.toLowerCase().includes(q) ||
          p.project.toLowerCase().includes(q)
      )
      .filter((p) => (p.apy ?? 0) >= apyFloor)
      .filter((p) => p.tvlUsd >= tvlFloor)
      .filter((p) => !onlyStarred || watchlist.has(p.id))
      .filter((p) => !onlyStable || p.stablecoin)
      .sort((a, b) => (sortBy === 'apy' ? (b.apy ?? 0) - (a.apy ?? 0) : b.tvlUsd - a.tvlUsd))
  }, [supportedPools, chain, debouncedSearch, minApy, minTvl, sortBy, onlyStarred, onlyStable, watchlist])

  const toggleCompare = (id) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < COMPARE_MAX ? [...prev, id] : prev
    )
  }
  const comparePools = useMemo(
    () => compareIds.map((id) => supportedPools.find((p) => p.id === id)).filter(Boolean),
    [compareIds, supportedPools]
  )

  const shown = filtered.slice(0, visible)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Pools Explorer</h1>
      <p className="text-sm text-txt-secondary mb-6">
        Live APY & TVL for liquidity pools across major chains. Data: DefiLlama.
      </p>

      {/* chain chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CHAINS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setChain(c)
              setVisible(PAGE_SIZE)
            }}
            className={`px-3.5 py-1.5 rounded-lg text-sm border transition-colors ${
              chain === c
                ? 'bg-gradient-to-r from-accent-from to-accent-to text-white border-transparent font-medium'
                : 'bg-card border-edge text-txt-secondary hover:border-edge-hover'
            }`}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => {
            setOnlyStarred((v) => !v)
            setVisible(PAGE_SIZE)
          }}
          className={`px-3.5 py-1.5 rounded-lg text-sm border transition-colors ${
            onlyStarred
              ? 'bg-warning/15 border-warning/40 text-warning font-medium'
              : 'bg-card border-edge text-txt-secondary hover:border-edge-hover'
          }`}
          title="Show only watchlisted pools"
        >
          ★ Watchlist
        </button>
        <button
          onClick={() => {
            setOnlyStable((v) => !v)
            setVisible(PAGE_SIZE)
          }}
          className={`px-3.5 py-1.5 rounded-lg text-sm border transition-colors ${
            onlyStable
              ? 'bg-positive/15 border-positive/40 text-positive font-medium'
              : 'bg-card border-edge text-txt-secondary hover:border-edge-hover'
          }`}
          title="Show only stablecoin pairs (per DefiLlama)"
        >
          🪙 Stablecoin pairs
        </button>
      </div>

      {/* trending / market movers */}
      {!isLoading && !isError && (
        <TrendingPools pools={supportedPools} onSelect={(p) => setSelected(p)} />
      )}

      {/* filters */}
      <div className="grid grid-cols-2 md:grid-cols-[1fr_140px_140px_150px] gap-3 mb-5">
        <input
          className="input col-span-2 md:col-span-1"
          placeholder="Search pool or protocol…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setVisible(PAGE_SIZE)
          }}
        />
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Min APY %"
          value={minApy}
          onChange={(e) => {
            setMinApy(e.target.value)
            setVisible(PAGE_SIZE)
          }}
        />
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Min TVL $"
          value={minTvl}
          onChange={(e) => {
            setMinTvl(e.target.value)
            setVisible(PAGE_SIZE)
          }}
        />
        <select className="input cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="tvl">Sort: TVL</option>
          <option value="apy">Sort: APY</option>
        </select>
      </div>

      {isLoading && (
        <div className="card p-4 flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          title="Couldn’t load pools"
          message="DefiLlama’s yields API didn’t respond. Check your connection and retry."
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon="🌊"
          title="No pools match your filters"
          message={
            onlyStarred
              ? 'Your watchlist is empty for these filters — star pools to track them.'
              : 'Try a different chain, lower the APY/TVL floors, or clear the search.'
          }
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <div className="hidden md:block card overflow-hidden">
            <div className="grid grid-cols-[20px_24px_2fr_1.2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 text-[11px] uppercase tracking-wider text-txt-secondary border-b border-edge">
              <span />
              <span />
              <span>Pool</span>
              <span>Project</span>
              <span>Chain</span>
              <span>TVL</span>
              <span>APY</span>
              <span>7d Δ</span>
            </div>
            {shown.map((pool) => (
              <PoolRow
                key={pool.id}
                pool={pool}
                starred={watchlist.has(pool.id)}
                onToggleStar={() => toggleStar(pool.id)}
                onSelect={() => setSelected(pool)}
                compareChecked={compareIds.includes(pool.id)}
                compareDisabled={compareIds.length >= COMPARE_MAX}
                onToggleCompare={() => toggleCompare(pool.id)}
              />
            ))}
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {shown.map((pool) => (
              <PoolRow
                key={pool.id}
                pool={pool}
                starred={watchlist.has(pool.id)}
                onToggleStar={() => toggleStar(pool.id)}
                onSelect={() => setSelected(pool)}
                compareChecked={compareIds.includes(pool.id)}
                compareDisabled={compareIds.length >= COMPARE_MAX}
                onToggleCompare={() => toggleCompare(pool.id)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-txt-secondary">
              Showing {shown.length} of {filtered.length} pools
            </p>
            {visible < filtered.length && (
              <button className="btn-secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more
              </button>
            )}
          </div>
        </>
      )}

      {selected && (
        <PoolDrawer
          pool={selected}
          starred={watchlist.has(selected.id)}
          onToggleStar={() => toggleStar(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {compareIds.length > 0 && !comparing && (
        <CompareBar
          count={compareIds.length}
          onCompare={() => setComparing(true)}
          onClear={() => setCompareIds([])}
        />
      )}
      {comparing && comparePools.length >= 2 && (
        <PoolCompare pools={comparePools} onClose={() => setComparing(false)} />
      )}
    </div>
  )
}
