import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { apiFetch } from '../services/api'
import StatCard from '../components/StatCard'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import { ChainBadge } from '../components/PoolRow'
import { isEvmAddress, looksLikeEns } from '../utils/validate'
import { formatUsd, formatTokenAmount, shortAddress } from '../utils/format'

const ensClient = createPublicClient({ chain: mainnet, transport: http() })

export default function Portfolio() {
  const [input, setInput] = useState('')
  const [target, setTarget] = useState(null) // { address, label }
  const [inputError, setInputError] = useState('')
  const [resolving, setResolving] = useState(false)

  const balances = useQuery({
    queryKey: ['balances', target?.address],
    queryFn: () => apiFetch(`/api/balances?address=${target.address}`),
    enabled: Boolean(target?.address),
    staleTime: 60 * 1000,
  })

  const track = async () => {
    const value = input.trim()
    setInputError('')
    if (isEvmAddress(value)) {
      setTarget({ address: value, label: shortAddress(value) })
      return
    }
    if (looksLikeEns(value)) {
      setResolving(true)
      try {
        const resolved = await ensClient.getEnsAddress({ name: normalize(value) })
        if (!resolved) {
          setInputError(`Couldn’t resolve ${value} — no address set for this ENS name.`)
        } else {
          setTarget({ address: resolved, label: value })
        }
      } catch {
        setInputError('ENS lookup failed. Try again or paste the raw 0x address.')
      } finally {
        setResolving(false)
      }
      return
    }
    setInputError('Enter a valid address (0x + 40 hex characters) or an ENS name like vitalik.eth.')
  }

  const tokens = balances.data?.tokens || []

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Portfolio</h1>
      <p className="text-sm text-txt-secondary mb-6">
        One-off wallet snapshot on Ethereum + Base. Balances under $1 are hidden.
      </p>

      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="0x… address or ENS name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && track()}
          />
          <button className="btn-primary" onClick={track} disabled={resolving || !input.trim()}>
            {resolving ? 'Resolving ENS…' : 'Track'}
          </button>
        </div>
        {inputError && <p className="text-xs text-negative mt-2">{inputError}</p>}
      </div>

      {balances.isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      )}

      {balances.isError && (
        <ErrorState
          title="Couldn’t load this wallet"
          message={balances.error?.message}
          onRetry={balances.refetch}
        />
      )}

      {balances.isSuccess && tokens.length === 0 && (
        <EmptyState
          icon="👛"
          title="Nothing over $1 here"
          message={`${target.label} holds no priced token balances above the $1 dust threshold on Ethereum or Base.`}
        />
      )}

      {balances.isSuccess && tokens.length > 0 && (
        <div className="flex flex-col gap-4">
          <StatCard
            label={`Total value · ${target.label}`}
            value={formatUsd(balances.data.totalUsd)}
            sub="Ethereum + Base, tokens over $1"
          />

          <div className="card overflow-hidden">
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 text-[11px] uppercase tracking-wider text-txt-secondary border-b border-edge">
              <span>Token</span>
              <span>Balance</span>
              <span>Price</span>
              <span className="text-right">Value</span>
            </div>
            {tokens.map((t, i) => (
              <div
                key={`${t.chain}-${t.contract || 'native'}-${i}`}
                className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-3 items-center px-4 py-3 border-b border-edge/60 last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {t.logo && <img src={t.logo} alt="" className="w-5 h-5 rounded-full" />}
                  <span className="font-medium text-sm truncate">{t.symbol}</span>
                  <ChainBadge chain={t.chain} />
                </div>
                <span className="text-sm text-txt-secondary text-right sm:text-left">
                  {formatTokenAmount(t.balance)}
                </span>
                <span className="hidden sm:block text-sm text-txt-secondary">
                  {t.priceUsd != null ? formatUsd(t.priceUsd) : '—'}
                </span>
                <span className="col-span-2 sm:col-span-1 text-sm font-semibold sm:text-right">
                  {formatUsd(t.valueUsd)}
                </span>
              </div>
            ))}
          </div>

          <div className="card p-5 bg-gradient-to-r from-accent-from/10 to-accent-to/10 border-accent-from/30">
            <h3 className="font-semibold mb-1">Track LP positions & get alerts</h3>
            <p className="text-sm text-txt-secondary mb-3">
              Pro monitors your Uniswap v3 positions with real-time IL, fee earnings and Telegram
              alerts when you go out of range.
            </p>
            <Link to="/pricing" className="btn-primary">
              See Pro →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
