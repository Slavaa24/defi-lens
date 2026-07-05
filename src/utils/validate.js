export function isEvmAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}

export function looksLikeEns(value) {
  return typeof value === 'string' && /^[a-z0-9-_.]+\.eth$/i.test(value.trim())
}

// Parse a numeric input string; returns fallback for empty/invalid.
export function parseNumber(value, fallback = 0) {
  if (value === '' || value == null) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}
