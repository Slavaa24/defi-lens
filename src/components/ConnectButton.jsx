import { ConnectButton as RKConnectButton } from '@rainbow-me/rainbowkit'
import useAuth from '../hooks/useAuth'
import { shortAddress } from '../utils/format'

// RainbowKit connect flow + SIWE sign-in step.
// States: disconnected -> [Connect Wallet]; connected, no session -> [Sign in] + chip;
// session active -> address chip (click to sign out & disconnect).
export default function ConnectButton() {
  const { isAuthed, user, signIn, signOut, signingIn } = useAuth()

  return (
    <RKConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, mounted }) => {
        const connected = mounted && account && chain

        if (!connected) {
          return (
            <button onClick={openConnectModal} className="btn-primary">
              Connect Wallet
            </button>
          )
        }

        if (chain.unsupported) {
          return (
            <button onClick={openChainModal} className="btn-secondary text-warning">
              Wrong network
            </button>
          )
        }

        if (!isAuthed) {
          return (
            <div className="flex items-center gap-2">
              <button onClick={() => signIn().catch(() => {})} disabled={signingIn} className="btn-primary">
                {signingIn ? 'Check wallet…' : 'Sign in'}
              </button>
              <span className="hidden sm:inline-flex items-center gap-2 text-xs font-mono text-txt-secondary">
                <span className="w-2 h-2 rounded-full bg-warning" />
                {shortAddress(account.address)}
              </span>
            </div>
          )
        }

        return (
          <button
            onClick={() => signOut()}
            className="btn-secondary font-mono text-xs"
            title="Click to sign out"
          >
            <span className="w-2 h-2 rounded-full bg-positive" />
            {shortAddress(user.address)}
          </button>
        )
      }}
    </RKConnectButton.Custom>
  )
}
