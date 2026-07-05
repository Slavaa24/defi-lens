import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { shortAddress } from '../utils/format'

// Phase 1: plain injected-wallet connect. RainbowKit + SIWE arrive in Phase 2.
export default function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [error, setError] = useState('')

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="btn-secondary font-mono text-xs"
        title="Click to disconnect"
      >
        <span className="w-2 h-2 rounded-full bg-positive" />
        {shortAddress(address)}
      </button>
    )
  }

  const handleConnect = () => {
    setError('')
    const connector = connectors[0]
    if (!connector) return
    connect(
      { connector },
      {
        onError: () => {
          setError('No wallet found')
          setTimeout(() => setError(''), 2500)
        },
      }
    )
  }

  return (
    <button onClick={handleConnect} disabled={isPending} className="btn-primary">
      {error || (isPending ? 'Connecting…' : 'Connect Wallet')}
    </button>
  )
}
