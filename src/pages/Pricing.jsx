import { Link } from 'react-router-dom'

const FREE = [
  'Impermanent loss calculator',
  'Pools explorer with live APY & TVL',
  'One-off portfolio snapshots',
  'Local watchlist',
]

const PRO = [
  'Up to 5 tracked wallets',
  'Uniswap v3 LP positions (Ethereum + Base)',
  'Real-time IL & fee earnings',
  'Out-of-range, IL-threshold and APY-drop alerts',
  'Telegram delivery',
  'Pay by card or USDC',
]

export default function Pricing() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1 text-center">Pricing</h1>
      <p className="text-sm text-txt-secondary mb-8 text-center">
        Start free. Upgrade when your liquidity deserves a babysitter.
      </p>

      <div className="grid sm:grid-cols-2 gap-5 items-stretch">
        <div className="card p-6 flex flex-col">
          <h2 className="font-semibold mb-1">Free</h2>
          <p className="text-3xl font-bold mb-4">
            $0<span className="text-sm font-normal text-txt-secondary">/forever</span>
          </p>
          <ul className="flex flex-col gap-2 text-sm text-txt-secondary mb-6">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-positive">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link to="/calculator" className="btn-secondary mt-auto">
            Start calculating
          </Link>
        </div>

        <div className="card p-6 flex flex-col border-accent-from/40 relative">
          <span className="absolute -top-2.5 right-4 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r from-accent-from to-accent-to text-white">
            COMING SOON
          </span>
          <h2 className="font-semibold mb-1">Pro</h2>
          <p className="text-3xl font-bold mb-4">
            $8<span className="text-sm font-normal text-txt-secondary">/month</span>
          </p>
          <ul className="flex flex-col gap-2 text-sm text-txt-secondary mb-6">
            {PRO.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-positive">✓</span> {f}
              </li>
            ))}
          </ul>
          <button className="btn-primary mt-auto" disabled title="Pro subscriptions open soon">
            Coming soon
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-600 text-center mt-6">
        Pro payments (card via Stripe, USDC via Coinbase Commerce) launch with the Pro dashboard.
      </p>
    </div>
  )
}
