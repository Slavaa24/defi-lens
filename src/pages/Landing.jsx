import { Link } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

const STEPS = [
  {
    n: '1',
    title: 'Model before you deposit',
    text: 'Run price scenarios in the IL calculator: see projected impermanent loss, fee offsets and the HODL comparison in seconds.',
  },
  {
    n: '2',
    title: 'Pick a pool that earns it',
    text: 'Filter thousands of pools by chain, APY and TVL, open any pool for its APY history, and star the ones worth watching.',
  },
  {
    n: '3',
    title: 'Monitor without staring',
    text: 'Go Pro to track your Uniswap v3 positions across wallets — real-time IL, fee earnings and a Telegram ping when you drift out of range.',
  },
]

const FEATURES = [
  {
    title: 'IL Calculator',
    text: 'Model impermanent loss before you deposit: price scenarios, fee APY offsets, HODL comparison and a full IL curve.',
    to: '/calculator',
    mock: (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-txt-secondary">Impermanent loss</span>
          <span className="text-negative font-bold">−5.72%</span>
        </div>
        <div className="h-1.5 rounded bg-edge overflow-hidden">
          <div className="h-full w-3/5 bg-gradient-to-r from-accent-from to-accent-to" />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-txt-secondary">Fees vs IL</span>
          <span className="text-positive font-bold">+$38.40 net</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Pools Explorer',
    text: 'Thousands of pools across Base, Ethereum, Arbitrum, Optimism and Polygon — filter by APY and TVL, star your watchlist.',
    to: '/pools',
    mock: (
      <div className="flex flex-col gap-1.5 text-xs">
        {[
          ['ETH/USDC', '$142M', '12.4%'],
          ['WBTC/ETH', '$88M', '8.1%'],
          ['AERO/USDC', '$21M', '31.7%'],
        ].map(([s, t, a]) => (
          <div key={s} className="flex justify-between">
            <span className="font-medium">{s}</span>
            <span className="text-txt-secondary">{t}</span>
            <span className="text-positive font-semibold">{a}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'LP Monitoring & Alerts',
    text: 'Pro tracks your Uniswap v3 positions: real-time IL, fee earnings, range status — with Telegram alerts the minute you drift out of range.',
    to: '/pricing',
    mock: (
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-negative" />
          <span className="font-medium">ETH/USDC 0.05%</span>
          <span className="ml-auto text-negative font-semibold">Out of range</span>
        </div>
        <div className="rounded-lg bg-bg border border-edge px-2.5 py-1.5 text-txt-secondary">
          ⚠️ Telegram: “Position no longer earning fees”
        </div>
      </div>
    ),
  },
]

const FAQ = [
  [
    'What is impermanent loss?',
    'When the two tokens in a liquidity pool change price relative to each other, your pooled value falls behind simply holding them. That gap is impermanent loss — it becomes permanent the moment you withdraw.',
  ],
  [
    'Is the calculator free?',
    'Yes. The IL calculator, pools explorer and one-off portfolio view are free forever, no sign-up needed.',
  ],
  [
    'What does Pro add?',
    'Pro ($8/mo) tracks LP positions across up to 5 wallets with real-time IL, fee earnings, and Telegram alerts for out-of-range, IL thresholds and APY drops.',
  ],
  [
    'Which protocols and chains are supported?',
    'The free tools cover pools on Base, Ethereum, Arbitrum, Optimism and Polygon. Pro position tracking launches with Uniswap v3 on Ethereum and Base, with more protocols on the roadmap.',
  ],
  [
    'Do you take custody of my funds or keys?',
    'Never. DeFi Lens is read-only: you paste an address or connect a wallet to read public on-chain data. We never ask for private keys or approvals to move funds.',
  ],
  [
    'How accurate is the data?',
    'Prices and APYs come from CoinGecko, DefiLlama and on-chain sources, and can be delayed. Anything we can’t compute reliably shows as “—” instead of a made-up number.',
  ],
]

export default function Landing() {
  useDocumentTitle()
  return (
    <div className="flex flex-col gap-20 pt-8">
      {/* hero */}
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
          Know your{' '}
          <span className="bg-gradient-to-r from-accent-from to-accent-to bg-clip-text text-transparent">
            impermanent loss
          </span>{' '}
          before it knows you
        </h1>
        <p className="text-txt-secondary text-lg mb-8">
          DeFi Lens gives liquidity providers the numbers that matter: IL projections, pool yields,
          and real-time position monitoring with Telegram alerts.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/calculator" className="btn-primary text-base px-7 py-3">
            Open the calculator
          </Link>
          <Link to="/pools" className="btn-secondary text-base px-7 py-3">
            Explore pools
          </Link>
        </div>
      </section>

      {/* features */}
      <section className="grid md:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <Link key={f.title} to={f.to} className="card p-6 flex flex-col gap-4 group">
            <div className="rounded-lg bg-bg border border-edge p-4">{f.mock}</div>
            <div>
              <h3 className="font-semibold mb-1 group-hover:text-accent-from transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-txt-secondary">{f.text}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* how it works */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">How it works</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-accent-from to-accent-to text-white font-bold flex items-center justify-center mb-4">
                {s.n}
              </div>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-txt-secondary">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pricing teaser */}
      <section className="card p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Free for research. Pro for peace of mind.</h2>
        <p className="text-txt-secondary mb-6">
          Calculator, pools and portfolio snapshots are free. Pro adds multi-wallet LP tracking and
          Telegram alerts for <span className="text-txt-primary font-semibold">$8/month</span>.
        </p>
        <Link to="/pricing" className="btn-primary">
          Compare plans
        </Link>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Frequently asked questions</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card p-5 group">
              <summary className="cursor-pointer font-medium flex items-center justify-between gap-3 list-none">
                {q}
                <span className="text-txt-secondary transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="text-sm text-txt-secondary mt-3">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
