// Pure impermanent-loss math for classic 50/50 AMM pools (Uniswap v2 style).
// All deltas are fractions: +1 = +100%, -0.5 = -50%.

// A -100% price change makes the pool math degenerate (division by zero /
// total loss). We clamp just above -100% and let the UI show a warning.
export const MIN_DELTA = -0.9999

export function clampDelta(delta) {
  const d = Number(delta)
  if (!Number.isFinite(d)) return { value: 0, clamped: false }
  if (d <= -1) return { value: MIN_DELTA, clamped: true }
  return { value: d, clamped: false }
}

// IL fraction for a 50/50 pool: r = (1+dA)/(1+dB); IL = 2*sqrt(r)/(1+r) - 1
// Always in [-1, 0].
export function ilV2(deltaA, deltaB) {
  const a = 1 + clampDelta(deltaA).value
  const b = 1 + clampDelta(deltaB).value
  const r = a / b
  if (!Number.isFinite(r) || r <= 0) return -1
  const il = (2 * Math.sqrt(r)) / (1 + r) - 1
  // guard against float noise around 0
  return Math.min(0, Math.max(-1, il))
}

// Value of the initial 50/50 deposit if simply held.
export function hodlValue(amount, deltaA, deltaB) {
  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt <= 0) return 0
  const a = 1 + clampDelta(deltaA).value
  const b = 1 + clampDelta(deltaB).value
  return (amt / 2) * a + (amt / 2) * b
}

// Value of the same deposit inside the pool: hodl * (1 + IL).
export function poolValue(amount, deltaA, deltaB) {
  return hodlValue(amount, deltaA, deltaB) * (1 + ilV2(deltaA, deltaB))
}

// Simple fee projection: amount * apy * days/365. apy is a fraction (0.2 = 20%).
export function feesEarned(amount, apy, days) {
  const amt = Number(amount)
  const rate = Number(apy)
  const d = Number(days)
  if (!Number.isFinite(d) || d < 0) {
    throw new RangeError('days must be a non-negative number')
  }
  if (!Number.isFinite(amt) || amt <= 0 || !Number.isFinite(rate) || rate <= 0) return 0
  return (amt * rate * d) / 365
}

// IL percentage points across a range of token-A price changes,
// with token B's change fixed. Used for the calculator chart.
export function ilCurve(deltaBFixed, { from = -0.8, to = 4, step = 0.05 } = {}) {
  const points = []
  // iterate in integer steps to avoid float drift
  const n = Math.round((to - from) / step)
  for (let i = 0; i <= n; i++) {
    const dA = from + i * step
    points.push({
      deltaA: Math.round(dA * 100),
      ilPct: ilV2(dA, deltaBFixed) * 100,
    })
  }
  return points
}
