// Uniswap v3 position math (SPEC §4). Float-based: results feed USD displays,
// not on-chain transactions, so double precision (~1e-15 relative) is fine.

const Q96 = 2 ** 96
const Q128 = 2n ** 128n
const Q256 = 2n ** 256n

export function sqrtRatioAtTick(tick) {
  return Math.pow(1.0001, tick / 2)
}

// Raw token amounts (in smallest units) held by liquidity L between ticks
// at the given sqrtPriceX96. Standard v3 formulas with price clamped to range.
export function amountsForLiquidity({ liquidity, sqrtPriceX96, tickLower, tickUpper }) {
  const L = Number(liquidity)
  const sp = Number(sqrtPriceX96) / Q96
  const sa = sqrtRatioAtTick(tickLower)
  const sb = sqrtRatioAtTick(tickUpper)
  if (!(L > 0) || !(sa > 0) || !(sb > sa)) return { amount0: 0, amount1: 0 }

  if (sp <= sa) {
    return { amount0: (L * (sb - sa)) / (sa * sb), amount1: 0 }
  }
  if (sp >= sb) {
    return { amount0: 0, amount1: L * (sb - sa) }
  }
  return {
    amount0: (L * (sb - sp)) / (sp * sb),
    amount1: L * (sp - sa),
  }
}

// Human-readable price of token0 in token1 units at a tick.
export function priceAtTick(tick, decimals0, decimals1) {
  return Math.pow(1.0001, tick) * Math.pow(10, decimals0 - decimals1)
}

export function isInRange(currentTick, tickLower, tickUpper) {
  return tickLower <= currentTick && currentTick < tickUpper
}

// IL of a v3 position vs holding the entry amounts (SPEC §4):
// IL = positionValueNow / hodlValue - 1, hodl = entry amounts at current prices.
// Returns null when it cannot be computed reliably (missing prices/entry).
export function ilV3({ valueNowUsd, entryAmount0, entryAmount1, price0Usd, price1Usd }) {
  if (
    valueNowUsd == null ||
    entryAmount0 == null ||
    entryAmount1 == null ||
    price0Usd == null ||
    price1Usd == null
  ) {
    return null
  }
  const hodl = entryAmount0 * price0Usd + entryAmount1 * price1Usd
  if (!(hodl > 0)) return null
  return valueNowUsd / hodl - 1
}

// Uncollected fees for one token side, in smallest units.
// tokensOwed plus fee growth since the position's last checkpoint:
//   fees = tokensOwed + L * (feeGrowthInsideNow - feeGrowthInsideLast) / 2^128
// All feeGrowth values are X128 fixed-point and wrap mod 2^256 by design.
export function uncollectedFees({
  liquidity,
  tokensOwed,
  feeGrowthInsideLastX128,
  feeGrowthGlobalX128,
  feeGrowthOutsideLowerX128,
  feeGrowthOutsideUpperX128,
  currentTick,
  tickLower,
  tickUpper,
}) {
  const L = BigInt(liquidity)
  const global = BigInt(feeGrowthGlobalX128)
  const outsideLower = BigInt(feeGrowthOutsideLowerX128)
  const outsideUpper = BigInt(feeGrowthOutsideUpperX128)

  const below = currentTick >= tickLower ? outsideLower : mod256(global - outsideLower)
  const above = currentTick < tickUpper ? outsideUpper : mod256(global - outsideUpper)
  const inside = mod256(global - below - above)
  const delta = mod256(inside - BigInt(feeGrowthInsideLastX128))
  return Number(BigInt(tokensOwed) + (L * delta) / Q128)
}

function mod256(x) {
  return ((x % Q256) + Q256) % Q256
}
