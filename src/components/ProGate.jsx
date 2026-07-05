import { Navigate } from 'react-router-dom'
import { ConnectButton as RKConnectButton } from '@rainbow-me/rainbowkit'
import useAuth from '../hooks/useAuth'
import Skeleton from './Skeleton'

// Until billing ships (Phase 4) every signed-in user gets Pro features;
// flip this to true once /pricing can actually upgrade an account.
const PRO_ENFORCED = false

export default function ProGate({ children }) {
  const { isAuthed, isLoading, isConnected, signIn, signingIn, signInError, user } = useAuth()

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto pt-8 flex flex-col gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto pt-16 text-center">
        <div className="card p-8">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-bold mb-2">Sign in to continue</h1>
          <p className="text-sm text-txt-secondary mb-6">
            The dashboard is tied to your wallet. Connect it, then sign a free message
            (no transaction, no gas) to prove ownership.
          </p>
          {isConnected ? (
            <button onClick={() => signIn().catch(() => {})} disabled={signingIn} className="btn-primary w-full">
              {signingIn ? 'Check your wallet…' : 'Sign in with Ethereum'}
            </button>
          ) : (
            <RKConnectButton.Custom>
              {({ openConnectModal }) => (
                <button onClick={openConnectModal} className="btn-primary w-full">
                  Connect Wallet
                </button>
              )}
            </RKConnectButton.Custom>
          )}
          {signInError && <p className="text-xs text-negative mt-3">{signInError}</p>}
        </div>
      </div>
    )
  }

  if (PRO_ENFORCED && user.plan !== 'pro') {
    return <Navigate to="/pricing" replace />
  }

  return children
}
