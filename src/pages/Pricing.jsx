import { Link } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

// Feature rows for the Free vs Pro comparison (SPEC §5.7 tier split).
// Values: true = ✓, false = —, string = custom text.
const ROWS = [
  ['Impermanent loss calculator', true, true],
  ['Pools explorer with live APY & TVL', true, true],
  ['Pool detail & APY history charts', true, true],
  ['One-off portfolio snapshots', true, true],
  ['Watchlist', 'Local', 'Synced to account'],
  ['Tracked wallets', false, 'Up to 5'],
  ['Uniswap v3 LP positions (Ethereum + Base)', false, true],
  ['Real-time IL & fee earnings', false, true],
  ['Out-of-range / IL-threshold / APY-drop alerts', false, true],
  ['Telegram delivery', false, true],
  ['Payment', false, 'Card or USDC'],
]

function Cell({ value }) {
  if (value === true) return <span className="text-positive">✓</span>
  if (value === false) return <span className="text-zinc-600">—</span>
  return <span className="text-txt-primary">{value}</span>
}

export default function Pricing() {
  useDocumentTitle('Pricing')
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1 text-center">Pricing</h1>
      <p className="text-sm text-txt-secondary mb-8 text-center">
        Start free. Upgrade when your liquidity deserves a babysitter.
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[430px]">
            <thead>
              <tr className="border-b border-edge">
                <th className="text-left font-medium text-txt-secondary px-4 sm:px-5 py-4 w-1/2">
                  Features
                </th>
                <th className="text-left px-3 sm:px-4 py-4">
                  <p className="font-semibold">Free</p>
                  <p className="text-lg font-bold">
                    $0<span className="text-xs font-normal text-txt-secondary">/forever</span>
                  </p>
                </th>
                <th className="text-left px-3 sm:px-4 py-4 relative">
                  <span className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gradient-to-r from-accent-from to-accent-to text-white">
                    SOON
                  </span>
                  <p className="font-semibold">Pro</p>
                  <p className="text-lg font-bold">
                    $8<span className="text-xs font-normal text-txt-secondary">/month</span>
                  </p>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([feature, free, pro]) => (
                <tr key={feature} className="border-b border-edge/60 last:border-0">
                  <td className="px-4 sm:px-5 py-3 text-txt-secondary">{feature}</td>
                  <td className="px-3 sm:px-4 py-3">
                    <Cell value={free} />
                  </td>
                  <td className="px-3 sm:px-4 py-3">
                    <Cell value={pro} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-4 sm:px-5 py-4" />
                <td className="px-3 sm:px-4 py-4">
                  <Link to="/calculator" className="btn-secondary whitespace-nowrap">
                    Start free
                  </Link>
                </td>
                <td className="px-3 sm:px-4 py-4">
                  <button className="btn-primary whitespace-nowrap" disabled title="Pro subscriptions open soon">
                    Coming soon
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-600 text-center mt-6">
        Pro payments (card via Stripe, USDC via Coinbase Commerce) launch with alerts and billing.
        No payment details are collected today.
      </p>
    </div>
  )
}
