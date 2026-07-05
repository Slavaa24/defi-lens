import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useDebounce from '../hooks/useDebounce'
import { searchTokens, getPrices } from '../services/coingecko'
import { formatUsd } from '../utils/format'

// CoinGecko-backed token picker with debounced search and live price display.
// value: { id, symbol, name, thumb? } | null
export default function TokenSelect({ label, value, onChange, placeholder = 'Search token…' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 400)
  const rootRef = useRef(null)

  const search = useQuery({
    queryKey: ['cg-search', debouncedQuery],
    queryFn: () => searchTokens(debouncedQuery),
    enabled: open && debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const price = useQuery({
    queryKey: ['cg-price', value?.id],
    queryFn: () => getPrices([value.id]),
    enabled: Boolean(value?.id),
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const select = (token) => {
    onChange(token)
    setQuery('')
    setOpen(false)
  }

  const currentPrice = value?.id ? price.data?.[value.id] : null

  return (
    <div ref={rootRef} className="relative">
      <label className="label">{label}</label>

      {value ? (
        <div className="flex items-center justify-between gap-2 bg-bg border border-edge rounded-lg px-3.5 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {value.thumb && <img src={value.thumb} alt="" className="w-5 h-5 rounded-full" />}
            <span className="font-semibold text-sm">{value.symbol}</span>
            <span className="text-xs text-txt-secondary truncate">{value.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-txt-secondary" title="Live CoinGecko price">
              {price.isLoading ? '…' : currentPrice != null ? formatUsd(currentPrice) : '—'}
            </span>
            <button
              onClick={() => onChange(null)}
              className="text-txt-secondary hover:text-txt-primary text-sm"
              title="Change token"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <input
          className="input"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      )}

      {open && !value && query.trim() && (
        <div className="absolute z-20 mt-1 w-full card p-1 max-h-72 overflow-y-auto shadow-xl shadow-black/50">
          {search.isLoading && (
            <div className="px-3 py-2 text-sm text-txt-secondary">Searching…</div>
          )}
          {search.isError && (
            <div className="px-3 py-2 text-sm text-negative">
              Search failed. CoinGecko may be rate-limiting — try again shortly.
            </div>
          )}
          {search.data && search.data.length === 0 && (
            <div className="px-3 py-2 text-sm text-txt-secondary">No tokens found</div>
          )}
          {(search.data || []).map((t) => (
            <button
              key={t.id}
              onClick={() => select(t)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-edge/50 text-left"
            >
              {t.thumb && <img src={t.thumb} alt="" className="w-5 h-5 rounded-full" />}
              <span className="font-medium text-sm">{t.symbol}</span>
              <span className="text-xs text-txt-secondary truncate">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
