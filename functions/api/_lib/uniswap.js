// Uniswap v3 position discovery on Ethereum + Base.
//
// Reads the NonfungiblePositionManager and pool contracts directly over
// Alchemy RPC (viem, batched multicall) instead of the official subgraphs:
// The Graph's hosted service was sunset and gateway queries need a separate
// THEGRAPH_API_KEY we don't have. On-chain reads are exact and need only
// ALCHEMY_KEY. Fees are computed from tokensOwed + feeGrowthInside deltas
// (SPEC §4); when any piece fails, fees come back null and render as "—".

import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet, base } from 'viem/chains'
import { amountsForLiquidity, priceAtTick, isInRange, ilV3, uncollectedFees } from './math.js'
import { getContractPrices } from './prices.js'

export const CHAINS = [
  {
    name: 'Ethereum',
    chain: mainnet,
    alchemy: 'eth-mainnet',
    positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  },
  {
    name: 'Base',
    chain: base,
    alchemy: 'base-mainnet',
    positionManager: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
  },
]

// keep RPC usage bounded for wallets holding many position NFTs
const MAX_NFTS_PER_WALLET = 50

const NPM_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
])

const FACTORY_ABI = parseAbi([
  'function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)',
])

const POOL_ABI = parseAbi([
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function feeGrowthGlobal0X128() view returns (uint256)',
  'function feeGrowthGlobal1X128() view returns (uint256)',
  'function ticks(int24 tick) view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)',
])

const ERC20_ABI = parseAbi([
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
])

function clientFor(chainCfg, env) {
  const key = env.ALCHEMY_KEY
  if (!key) {
    const err = new Error('Server is not configured (missing RPC provider key).')
    err.status = 503
    throw err
  }
  return createPublicClient({
    chain: chainCfg.chain,
    transport: http(`https://${chainCfg.alchemy}.g.alchemy.com/v2/${key}`),
    batch: { multicall: { wait: 16 } },
  })
}

async function tokenMeta(client, address, cache) {
  const key = address.toLowerCase()
  if (!cache.has(key)) {
    cache.set(
      key,
      Promise.all([
        client.readContract({ address, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => '?'),
        client.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }),
      ]).then(([symbol, decimals]) => ({ symbol, address: key, decimals: Number(decimals) }))
    )
  }
  return cache.get(key)
}

// Discover all live v3 positions (liquidity > 0) a wallet owns on one chain.
// Returns rows shaped for the positions table (minus wallet_id) — snapshots,
// in_range and fee/IL metrics are already computed.
async function discoverOnChain(chainCfg, owner, env) {
  const client = clientFor(chainCfg, env)
  const npm = { address: chainCfg.positionManager, abi: NPM_ABI }

  const balance = Number(
    await client.readContract({ ...npm, functionName: 'balanceOf', args: [owner] })
  )
  const count = Math.min(balance, MAX_NFTS_PER_WALLET)
  if (count === 0) return []

  const tokenIds = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      client.readContract({ ...npm, functionName: 'tokenOfOwnerByIndex', args: [owner, BigInt(i)] })
    )
  )
  const rawPositions = await Promise.all(
    tokenIds.map((id) => client.readContract({ ...npm, functionName: 'positions', args: [id] }))
  )

  const live = rawPositions
    .map((p, i) => ({
      tokenId: tokenIds[i],
      token0: p[2],
      token1: p[3],
      fee: Number(p[4]),
      tickLower: Number(p[5]),
      tickUpper: Number(p[6]),
      liquidity: p[7],
      feeGrowthInside0LastX128: p[8],
      feeGrowthInside1LastX128: p[9],
      tokensOwed0: p[10],
      tokensOwed1: p[11],
    }))
    .filter((p) => p.liquidity > 0n)
  if (live.length === 0) return []

  // resolve pool addresses + state, deduped per pool
  const metaCache = new Map()
  const poolCache = new Map()
  const results = []

  await Promise.all(
    live.map(async (p) => {
      const poolKey = `${p.token0}-${p.token1}-${p.fee}`.toLowerCase()
      if (!poolCache.has(poolKey)) {
        poolCache.set(
          poolKey,
          client
            .readContract({
              address: chainCfg.factory,
              abi: FACTORY_ABI,
              functionName: 'getPool',
              args: [p.token0, p.token1, p.fee],
            })
            .then(async (poolAddress) => {
              const [slot0, global0, global1] = await Promise.all([
                client.readContract({ address: poolAddress, abi: POOL_ABI, functionName: 'slot0' }),
                client.readContract({
                  address: poolAddress,
                  abi: POOL_ABI,
                  functionName: 'feeGrowthGlobal0X128',
                }),
                client.readContract({
                  address: poolAddress,
                  abi: POOL_ABI,
                  functionName: 'feeGrowthGlobal1X128',
                }),
              ])
              return {
                address: poolAddress,
                sqrtPriceX96: slot0[0],
                tick: Number(slot0[1]),
                feeGrowthGlobal0X128: global0,
                feeGrowthGlobal1X128: global1,
              }
            })
        )
      }
      const pool = await poolCache.get(poolKey)

      const [token0, token1] = await Promise.all([
        tokenMeta(client, p.token0, metaCache),
        tokenMeta(client, p.token1, metaCache),
      ])

      // fee state is optional — a failed tick read must not sink the position
      let fees = null
      try {
        const [lower, upper] = await Promise.all([
          client.readContract({
            address: pool.address,
            abi: POOL_ABI,
            functionName: 'ticks',
            args: [p.tickLower],
          }),
          client.readContract({
            address: pool.address,
            abi: POOL_ABI,
            functionName: 'ticks',
            args: [p.tickUpper],
          }),
        ])
        fees = {
          raw0: uncollectedFees({
            liquidity: p.liquidity,
            tokensOwed: p.tokensOwed0,
            feeGrowthInsideLastX128: p.feeGrowthInside0LastX128,
            feeGrowthGlobalX128: pool.feeGrowthGlobal0X128,
            feeGrowthOutsideLowerX128: lower[2],
            feeGrowthOutsideUpperX128: upper[2],
            currentTick: pool.tick,
            tickLower: p.tickLower,
            tickUpper: p.tickUpper,
          }),
          raw1: uncollectedFees({
            liquidity: p.liquidity,
            tokensOwed: p.tokensOwed1,
            feeGrowthInsideLastX128: p.feeGrowthInside1LastX128,
            feeGrowthGlobalX128: pool.feeGrowthGlobal1X128,
            feeGrowthOutsideLowerX128: lower[3],
            feeGrowthOutsideUpperX128: upper[3],
            currentTick: pool.tick,
            tickLower: p.tickLower,
            tickUpper: p.tickUpper,
          }),
        }
      } catch {
        fees = null // render "—" rather than a wrong number (SPEC §4)
      }

      results.push({ position: p, pool, token0, token1, fees })
    })
  )

  // price all involved tokens in one CoinGecko pass
  const uniqueTokens = [...new Set(results.flatMap((r) => [r.token0.address, r.token1.address]))]
  const prices = await getContractPrices(chainCfg.name, uniqueTokens, env)

  return results.map(({ position: p, pool, token0, token1, fees }) => {
    const { amount0: raw0, amount1: raw1 } = amountsForLiquidity({
      liquidity: p.liquidity,
      sqrtPriceX96: pool.sqrtPriceX96,
      tickLower: p.tickLower,
      tickUpper: p.tickUpper,
    })
    const amount0 = raw0 / 10 ** token0.decimals
    const amount1 = raw1 / 10 ** token1.decimals
    const price0Usd = prices[token0.address] ?? null
    const price1Usd = prices[token1.address] ?? null
    const valueUsd =
      price0Usd != null && price1Usd != null ? amount0 * price0Usd + amount1 * price1Usd : null

    let feesToken0 = null
    let feesToken1 = null
    let feesUsd = null
    if (fees) {
      feesToken0 = fees.raw0 / 10 ** token0.decimals
      feesToken1 = fees.raw1 / 10 ** token1.decimals
      if (price0Usd != null && price1Usd != null) {
        feesUsd = feesToken0 * price0Usd + feesToken1 * price1Usd
      }
    }

    const inRange = isInRange(pool.tick, p.tickLower, p.tickUpper)
    const snapshot = {
      ts: new Date().toISOString(),
      tick: pool.tick,
      sqrtPriceX96: pool.sqrtPriceX96.toString(),
      amount0,
      amount1,
      price0Usd,
      price1Usd,
      valueUsd,
      feesToken0,
      feesToken1,
      feesUsd,
      priceLower: priceAtTick(p.tickLower, token0.decimals, token1.decimals),
      priceUpper: priceAtTick(p.tickUpper, token0.decimals, token1.decimals),
      priceCurrent: priceAtTick(pool.tick, token0.decimals, token1.decimals),
    }

    return {
      protocol: 'uniswap_v3',
      chain: chainCfg.name,
      pool_address: pool.address.toLowerCase(),
      nft_token_id: p.tokenId.toString(),
      token0,
      token1,
      fee: p.fee,
      tick_lower: p.tickLower,
      tick_upper: p.tickUpper,
      liquidity: p.liquidity.toString(),
      in_range: inRange,
      snapshot,
    }
  })
}

// Discover across all supported chains. Per-chain failures are collected so
// one chain's RPC hiccup doesn't wipe the other's results.
export async function discoverPositions(owner, env) {
  const settled = await Promise.allSettled(CHAINS.map((c) => discoverOnChain(c, owner, env)))
  const positions = []
  const errors = []
  settled.forEach((s, i) => {
    if (s.status === 'fulfilled') positions.push(...s.value)
    else errors.push({ chain: CHAINS[i].name, message: s.reason?.message || 'discovery failed' })
  })
  return { positions, errors }
}

// Attach IL to a fresh snapshot given the stored entry snapshot.
export function withIl(snapshot, entrySnapshot) {
  const ilFrac = ilV3({
    valueNowUsd: snapshot.valueUsd,
    entryAmount0: entrySnapshot?.amount0,
    entryAmount1: entrySnapshot?.amount1,
    price0Usd: snapshot.price0Usd,
    price1Usd: snapshot.price1Usd,
  })
  const hodl =
    ilFrac != null
      ? entrySnapshot.amount0 * snapshot.price0Usd + entrySnapshot.amount1 * snapshot.price1Usd
      : null
  return {
    ...snapshot,
    ilPct: ilFrac != null ? ilFrac * 100 : null,
    ilUsd: ilFrac != null ? snapshot.valueUsd - hodl : null,
  }
}
