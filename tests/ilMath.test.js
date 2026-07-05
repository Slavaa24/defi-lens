import { describe, it, expect } from 'vitest'
import {
  ilV2,
  hodlValue,
  poolValue,
  feesEarned,
  ilCurve,
  clampDelta,
  MIN_DELTA,
} from '../src/utils/ilMath'

describe('ilV2', () => {
  it('is 0 when both tokens move identically', () => {
    expect(ilV2(0, 0)).toBeCloseTo(0, 10)
    expect(ilV2(0.5, 0.5)).toBeCloseTo(0, 10)
    expect(ilV2(-0.3, -0.3)).toBeCloseTo(0, 10)
  })

  it('matches the classic 2x divergence value (~-5.72%)', () => {
    // r = 2: IL = 2*sqrt(2)/3 - 1
    expect(ilV2(1, 0)).toBeCloseTo((2 * Math.sqrt(2)) / 3 - 1, 6)
  })

  it('is symmetric in r and 1/r', () => {
    expect(ilV2(1, 0)).toBeCloseTo(ilV2(0, 1), 10)
  })

  it('clamps a -100% move instead of dividing by zero', () => {
    const il = ilV2(-1, 0)
    expect(Number.isFinite(il)).toBe(true)
    expect(il).toBeLessThan(-0.95)
    expect(il).toBeGreaterThanOrEqual(-1)

    // -100% on token B (denominator) must also stay finite
    const ilB = ilV2(0, -1)
    expect(Number.isFinite(ilB)).toBe(true)
  })

  it('stays finite and bounded for extremely large r', () => {
    const il = ilV2(1e9, 0)
    expect(Number.isFinite(il)).toBe(true)
    expect(il).toBeGreaterThanOrEqual(-1)
    expect(il).toBeLessThanOrEqual(0)
  })
})

describe('hodl and pool values', () => {
  it('returns 0 for amt = 0', () => {
    expect(hodlValue(0, 1, 0)).toBe(0)
    expect(poolValue(0, 1, 0)).toBe(0)
  })

  it('computes hodl as the sum of both halves', () => {
    // $1000, A +100%, B flat: 500*2 + 500*1 = 1500
    expect(hodlValue(1000, 1, 0)).toBeCloseTo(1500, 10)
  })

  it('pool value equals hodl * (1 + IL)', () => {
    const hodl = hodlValue(1000, 1, 0)
    const il = ilV2(1, 0)
    expect(poolValue(1000, 1, 0)).toBeCloseTo(hodl * (1 + il), 10)
  })

  it('ignores non-finite amounts', () => {
    expect(hodlValue(NaN, 1, 0)).toBe(0)
    expect(hodlValue(Infinity, 1, 0)).toBe(0)
  })
})

describe('feesEarned', () => {
  it('computes amt * apy * days/365', () => {
    expect(feesEarned(1000, 0.2, 365)).toBeCloseTo(200, 10)
    expect(feesEarned(1000, 0.365, 10)).toBeCloseTo(10, 10)
  })

  it('rejects negative days', () => {
    expect(() => feesEarned(1000, 0.2, -1)).toThrow(RangeError)
  })

  it('returns 0 for zero/invalid amount or apy', () => {
    expect(feesEarned(0, 0.2, 30)).toBe(0)
    expect(feesEarned(1000, 0, 30)).toBe(0)
    expect(feesEarned(NaN, 0.2, 30)).toBe(0)
  })
})

describe('clampDelta', () => {
  it('clamps at -100% and flags it', () => {
    expect(clampDelta(-1)).toEqual({ value: MIN_DELTA, clamped: true })
    expect(clampDelta(-2)).toEqual({ value: MIN_DELTA, clamped: true })
  })

  it('passes normal values through', () => {
    expect(clampDelta(0.5)).toEqual({ value: 0.5, clamped: false })
  })
})

describe('ilCurve', () => {
  it('spans -80%..+400% and is 0 where dA equals dB', () => {
    const curve = ilCurve(0)
    expect(curve[0].deltaA).toBe(-80)
    expect(curve[curve.length - 1].deltaA).toBe(400)
    const zeroPoint = curve.find((p) => p.deltaA === 0)
    expect(zeroPoint.ilPct).toBeCloseTo(0, 6)
  })

  it('produces only non-positive IL values', () => {
    for (const p of ilCurve(0.5)) {
      expect(p.ilPct).toBeLessThanOrEqual(0)
    }
  })
})
