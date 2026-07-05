const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const fullUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

// $1.2M style
export function formatUsdCompact(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  return compactUsd.format(Number(n))
}

export function formatUsd(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  return fullUsd.format(Number(n))
}

// 2-decimal percent; signed adds an explicit "+" for positive values
export function formatPercent(n, { signed = false } = {}) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  const v = Number(n)
  const sign = signed && v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

export function formatTokenAmount(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  const v = Number(n)
  if (v !== 0 && Math.abs(v) < 0.0001) return '<0.0001'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(v)
}

// Token prices span many magnitudes (0.000004 SHIB … 96000 BTC);
// show 4 significant digits instead of fixed decimals.
export function formatPrice(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  const v = Number(n)
  if (v === 0) return '0'
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 }).format(v)
}

// Coarse age: "3d", "2mo" — enough for "how old is this position".
export function timeAgo(iso) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 60) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

export function shortAddress(address) {
  if (!address || address.length < 10) return address || ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
