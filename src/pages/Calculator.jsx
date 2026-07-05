import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import TokenSelect from '../components/TokenSelect'
import StatCard from '../components/StatCard'
import { ilV2, hodlValue, poolValue, feesEarned, ilCurve } from '../utils/ilMath'
import { formatUsd, formatPercent } from '../utils/format'
import { parseNumber } from '../utils/validate'

const PRESETS = [-50, -25, -10, 10, 25, 50, 100, 400]

function readToken(params, idKey, symbolKey) {
  const id = params.get(idKey)
  if (!id) return null
  return { id, symbol: params.get(symbolKey) || id.toUpperCase(), name: '' }
}

export default function Calculator() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [tokenA, setTokenA] = useState(() => readToken(searchParams, 'ta', 'tas'))
  const [tokenB, setTokenB] = useState(() => readToken(searchParams, 'tb', 'tbs'))
  const [amount, setAmount] = useState(() => searchParams.get('amt') ?? '1000')
  const [dA, setDA] = useState(() => searchParams.get('da') ?? '')
  const [dB, setDB] = useState(() => searchParams.get('db') ?? '')
  const [apy, setApy] = useState(() => searchParams.get('apy') ?? '')
  const [days, setDays] = useState(() => searchParams.get('days') ?? '30')

  // keep state shareable via URL
  useEffect(() => {
    const params = {}
    if (tokenA) {
      params.ta = tokenA.id
      params.tas = tokenA.symbol
    }
    if (tokenB) {
      params.tb = tokenB.id
      params.tbs = tokenB.symbol
    }
    if (amount !== '') params.amt = amount
    if (dA !== '') params.da = dA
    if (dB !== '') params.db = dB
    if (apy !== '') params.apy = apy
    if (days !== '') params.days = days
    setSearchParams(params, { replace: true })
  }, [tokenA, tokenB, amount, dA, dB, apy, days, setSearchParams])

  const result = useMemo(() => {
    const amt = Math.max(0, parseNumber(amount))
    const deltaA = parseNumber(dA) / 100
    const deltaB = parseNumber(dB) / 100
    const apyFrac = Math.max(0, parseNumber(apy)) / 100
    const daysNum = parseNumber(days, NaN)

    const daysInvalid = Number.isFinite(daysNum) && daysNum < 0
    const clampedA = parseNumber(dA) <= -100
    const clampedB = parseNumber(dB) <= -100

    const il = ilV2(deltaA, deltaB)
    const hodl = hodlValue(amt, deltaA, deltaB)
    const pool = poolValue(amt, deltaA, deltaB)
    const ilUsd = pool - hodl // ≤ 0
    const fees =
      !daysInvalid && Number.isFinite(daysNum) && apyFrac > 0
        ? feesEarned(amt, apyFrac, daysNum)
        : null
    const net = fees != null ? fees + ilUsd : null

    return {
      amt,
      deltaB,
      il,
      ilPct: il * 100,
      hodl,
      pool,
      ilUsd,
      fees,
      net,
      daysInvalid,
      clamped: clampedA || clampedB,
      curve: ilCurve(deltaB),
      currentDeltaAPct: parseNumber(dA),
    }
  }, [amount, dA, dB, apy, days])

  const presets = useMemo(() => {
    return PRESETS.map((pct) => {
      const il = ilV2(pct / 100, result.deltaB)
      const hodl = hodlValue(result.amt, pct / 100, result.deltaB)
      const ilUsd = hodl * il
      return { pct, ilPct: il * 100, ilUsd }
    })
  }, [result.amt, result.deltaB])

  const pairLabel =
    tokenA && tokenB ? `${tokenA.symbol}/${tokenB.symbol}` : 'your pair'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Impermanent Loss Calculator</h1>
      <p className="text-sm text-txt-secondary mb-6">
        Estimate IL, fee earnings and HODL-vs-pool outcomes for {pairLabel}.
      </p>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* inputs */}
        <div className="card p-5 flex flex-col gap-4">
          <TokenSelect label="Token A" value={tokenA} onChange={setTokenA} placeholder="e.g. ETH" />
          <TokenSelect label="Token B" value={tokenB} onChange={setTokenB} placeholder="e.g. USDC" />

          <div>
            <label className="label">Investment (USD)</label>
            <input
              type="number"
              className="input"
              value={amount}
              min="0"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Token A price change (%)</label>
              <input
                type="number"
                className="input"
                value={dA}
                onChange={(e) => setDA(e.target.value)}
                placeholder="+100 or -50"
              />
            </div>
            <div>
              <label className="label">Token B price change (%)</label>
              <input
                type="number"
                className="input"
                value={dB}
                onChange={(e) => setDB(e.target.value)}
                placeholder="0 for stables"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pool fee APY (%)</label>
              <input
                type="number"
                className="input"
                value={apy}
                min="0"
                onChange={(e) => setApy(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            <div>
              <label className="label">Days in position</label>
              <input
                type="number"
                className="input"
                value={days}
                min="0"
                onChange={(e) => setDays(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          {result.daysInvalid && (
            <p className="text-xs text-negative">Days in position can’t be negative.</p>
          )}
          {result.clamped && (
            <p className="text-xs text-warning">
              A −100% price change means total loss — values are clamped to −99.99% for the math.
            </p>
          )}
        </div>

        {/* results */}
        <div className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              label="Impermanent loss"
              value={formatPercent(result.ilPct)}
              sub={result.ilUsd < 0 ? `${formatUsd(result.ilUsd)} vs HODL` : 'No divergence yet'}
              tone={result.ilPct < -0.005 ? 'negative' : 'neutral'}
            />
            <StatCard label="If HODLed" value={formatUsd(result.hodl)} tone="positive" />
            <StatCard label="In the pool" value={formatUsd(result.pool)} tone="warning" />
          </div>

          {/* fees vs IL verdict */}
          {result.fees != null ? (
            <div
              className={`card p-5 border ${
                result.net >= 0 ? 'border-positive/40' : 'border-negative/40'
              }`}
            >
              <p className="text-[11px] uppercase tracking-wider text-txt-secondary mb-3">
                Fees vs impermanent loss · {parseNumber(days)} days
              </p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <span>
                  Fees earned: <span className="text-positive font-semibold">+{formatUsd(result.fees)}</span>
                </span>
                <span>
                  IL: <span className="text-negative font-semibold">{formatUsd(result.ilUsd)}</span>
                </span>
                <span className="ml-auto font-bold text-base">
                  Net:{' '}
                  <span className={result.net >= 0 ? 'text-positive' : 'text-negative'}>
                    {result.net >= 0 ? '+' : ''}
                    {formatUsd(result.net)}
                  </span>
                </span>
              </div>
              <p className="text-xs text-txt-secondary mt-2">
                {result.net >= 0
                  ? 'Projected fees outweigh impermanent loss at these assumptions.'
                  : 'Impermanent loss outweighs projected fees at these assumptions.'}
              </p>
            </div>
          ) : (
            <div className="card p-5">
              <p className="text-sm text-txt-secondary">
                Add a pool fee APY and days in position to compare fee earnings against IL.
              </p>
            </div>
          )}

          {/* IL curve */}
          <div className="card p-5">
            <p className="text-[11px] uppercase tracking-wider text-txt-secondary mb-4">
              IL across Token A price change (−80% … +400%), Token B fixed at{' '}
              {formatPercent(result.deltaB * 100, { signed: true })}
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={result.curve} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis
                  dataKey="deltaA"
                  type="number"
                  domain={[-80, 400]}
                  ticks={[-80, 0, 100, 200, 300, 400]}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  stroke="#1f1f1f"
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  stroke="#1f1f1f"
                />
                <Tooltip
                  contentStyle={{
                    background: '#111111',
                    border: '1px solid #1f1f1f',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => `Token A ${v > 0 ? '+' : ''}${v}%`}
                  formatter={(v) => [`${v.toFixed(2)}%`, 'IL']}
                />
                <ReferenceLine y={0} stroke="#3f3f46" />
                {dA !== '' && (
                  <ReferenceLine
                    x={Math.max(-80, Math.min(400, result.currentDeltaAPct))}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="ilPct"
                  stroke="#ef4444"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* presets */}
          <div className="card p-5 overflow-x-auto">
            <p className="text-[11px] uppercase tracking-wider text-txt-secondary mb-3">
              Scenarios for Token A (Token B fixed)
            </p>
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-xs text-txt-secondary">
                  <th className="py-2 font-medium">Price change</th>
                  <th className="py-2 font-medium">IL</th>
                  <th className="py-2 font-medium">Loss vs HODL</th>
                </tr>
              </thead>
              <tbody>
                {presets.map((p) => (
                  <tr key={p.pct} className="border-t border-edge/60">
                    <td className="py-2">
                      {p.pct === 100 ? '2x' : p.pct === 400 ? '5x' : `${p.pct > 0 ? '+' : ''}${p.pct}%`}
                    </td>
                    <td className={`py-2 ${p.ilPct < -0.005 ? 'text-negative' : 'text-txt-secondary'}`}>
                      {formatPercent(p.ilPct)}
                    </td>
                    <td className="py-2 text-txt-secondary">
                      {result.amt > 0 ? formatUsd(p.ilUsd) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-zinc-600">
            Assumes classic 50/50 AMM. Concentrated liquidity differs.
          </p>
        </div>
      </div>
    </div>
  )
}
