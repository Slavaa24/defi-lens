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

export function shortAddress(address) {
  if (!address || address.length < 10) return address || ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
