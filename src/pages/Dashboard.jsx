import { useState } from 'react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import ProGate from '../components/ProGate'
import PositionCard from '../components/PositionCard'
import StatCard from '../components/StatCard'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import usePositions from '../hooks/usePositions'
import { isEvmAddress, looksLikeEns } from '../utils/validate'
import { formatUsd, shortAddress } from '../utils/format'

const ensClient = createPublicClient({ chain: mainnet, transport: http() })
const REFRESH_COOLDOWN_S = 60

function WalletManager({ wallets, addWallet, removeWallet }) {
  const [address, setAddress] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)
  const atCap = wallets.length >= 5

  const add = async () => {
    const value = address.trim()
    setError('')
    let resolved = value
    if (looksLikeEns(value)) {
      setResolving(true)
      try {
        resolved = await ensClient.getEnsAddress({ name: normalize(value) })
        if (!resolved) throw new Error(`No address set for ${value}.`)
      } catch (err) {
        setError(err?.message || 'ENS lookup failed — paste the raw 0x address.')
        setResolving(false)
        return
      }
      setResolving(false)
    } else if (!isEvmAddress(value)) {
      setError('Enter a valid address (0x + 40 hex characters) or an ENS name.')
      return
    }
    addWallet.mutate(
      { address: resolved, label: label.trim() || undefined },
      {
        onSuccess: () => {
          setAddress('')
          setLabel('')
        },
        onError: (err) => setError(err?.message || 'Failed to add wallet.'),
      }
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Wallets</h2>
        <span className="text-xs text-txt-secondary">{wallets.length} / 5</span>
      </div>

      {wallets.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-edge/60"
            >
              <div className="min-w-0">
                {w.label && <div className="text-sm font-medium truncate">{w.label}</div>}
                <div className="text-xs font-mono text-txt-secondary">{shortAddress(w.address)}</div>
              </div>
              <button
                onClick={() => removeWallet.mutate(w.id)}
                disabled={removeWallet.isPending}
                className="text-xs text-txt-secondary hover:text-negative transition-colors shrink-0"
                title="Remove wallet and its tracked positions"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="input flex-[2]"
          placeholder="0x… address or ENS name"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !atCap && add()}
          disabled={atCap}
        />
        <input
          className="input flex-1"
          placeholder="Label (optional)"
          value={label}
          maxLength={40}
          onChange={(e) => setLabel(e.target.value)}
          disabled={atCap}
        />
        <button
          className="btn-primary shrink-0"
          onClick={add}
          disabled={atCap || resolving || addWallet.isPending || !address.trim()}
        >
          {resolving ? 'Resolving…' : addWallet.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {atCap && <p className="text-xs text-txt-secondary mt-2">Wallet limit reached — remove one to add another.</p>}
      {error && <p className="text-xs text-negative mt-2">{error}</p>}
    </div>
  )
}

function DashboardInner() {
  const { positions, wallets, refreshErrors, query, refresh, addWallet, removeWallet } =
    usePositions()
  const [cooldown, setCooldown] = useState(0)

  const startCooldown = (seconds) => {
    setCooldown(seconds)
    const timer = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) clearInterval(timer)
        return s - 1
      })
    }, 1000)
  }

  const doRefresh = () => {
    refresh.mutate(undefined, {
      onSuccess: () => startCooldown(REFRESH_COOLDOWN_S),
      onError: (err) => {
        if (err?.status === 429) startCooldown(REFRESH_COOLDOWN_S)
      },
    })
  }

  const totalValue = positions.reduce((sum, p) => sum + (p.last_snapshot?.valueUsd ?? 0), 0)
  const totalIl = positions.reduce((sum, p) => sum + (p.last_snapshot?.ilUsd ?? 0), 0)
  const outOfRange = positions.filter((p) => p.in_range === false).length
  const hasAnyValue = positions.some((p) => p.last_snapshot?.valueUsd != null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-txt-secondary">
            Uniswap v3 positions across your wallets on Ethereum + Base.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={doRefresh}
          disabled={refresh.isPending || cooldown > 0 || wallets.length === 0}
          title="Re-read all positions on-chain (once a minute)"
        >
          {refresh.isPending ? 'Refreshing…' : cooldown > 0 ? `Refresh (${cooldown}s)` : '↻ Refresh'}
        </button>
      </div>

      {query.isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36" />
          <div className="grid sm:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-44" />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Couldn’t load your dashboard"
          message={query.error?.message}
          onRetry={query.refetch}
        />
      ) : (
        <>
          <WalletManager wallets={wallets} addWallet={addWallet} removeWallet={removeWallet} />

          {refresh.isError && refresh.error?.status !== 429 && (
            <p className="text-xs text-negative">{refresh.error?.message}</p>
          )}
          {refreshErrors.length > 0 && (
            <div className="card p-3 border-warning/40">
              <p className="text-xs text-warning">
                Some data may be incomplete:{' '}
                {refreshErrors.map((e) => `${e.chain}: ${e.message}`).join(' · ')}
              </p>
            </div>
          )}

          {positions.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard
                label="Total LP value"
                value={hasAnyValue ? formatUsd(totalValue) : '—'}
                sub={`${positions.length} position${positions.length === 1 ? '' : 's'}`}
              />
              <StatCard
                label="Aggregate IL"
                value={hasAnyValue ? formatUsd(totalIl) : '—'}
                sub="vs holding entry amounts"
              />
              <StatCard
                label="Out of range"
                value={String(outOfRange)}
                sub={outOfRange > 0 ? 'not earning fees' : 'all positions earning'}
              />
            </div>
          )}

          {wallets.length === 0 ? (
            <EmptyState
              icon="👛"
              title="Add a wallet to start"
              message="Add up to 5 wallet addresses above — we’ll discover their live Uniswap v3 positions on Ethereum and Base automatically."
            />
          ) : positions.length === 0 ? (
            refresh.isPending || addWallet.isPending ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
              </div>
            ) : (
              <EmptyState
                icon="🔍"
                title="No live positions found"
                message="None of your wallets hold Uniswap v3 positions with active liquidity on Ethereum or Base. Positions appear here automatically after a refresh."
              />
            )
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {positions.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProGate>
      <DashboardInner />
    </ProGate>
  )
}
