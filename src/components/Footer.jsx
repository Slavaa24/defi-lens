import { Link } from 'react-router-dom'

const PRODUCT_LINKS = [
  ['/calculator', 'Calculator'],
  ['/pools', 'Pools'],
  ['/portfolio', 'Portfolio'],
  ['/pricing', 'Pricing'],
]

const LEGAL_LINKS = [
  ['/terms', 'Terms'],
  ['/privacy', 'Privacy'],
]

export default function Footer() {
  return (
    <footer className="border-t border-edge mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-2 text-sm text-txt-secondary">
            <span>⚡</span>
            <span className="font-semibold text-txt-primary">DeFi Lens</span>
            <span className="hidden sm:inline">· LP analytics & IL monitoring</span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <nav className="flex items-center gap-5 text-sm text-txt-secondary">
              {PRODUCT_LINKS.map(([to, label]) => (
                <Link key={to} to={to} className="hover:text-txt-primary transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
            <nav className="flex items-center gap-5 text-sm text-txt-secondary">
              {LEGAL_LINKS.map(([to, label]) => (
                <Link key={to} to={to} className="hover:text-txt-primary transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600">
          <p>
            Data by{' '}
            <a
              href="https://defillama.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-txt-secondary transition-colors"
            >
              DefiLlama
            </a>{' '}
            &{' '}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-txt-secondary transition-colors"
            >
              CoinGecko
            </a>
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          DeFi Lens is for informational purposes only and is not financial advice. Data may be
          delayed or inaccurate. We accept no liability for trading decisions made using this
          site.
        </p>
      </div>
    </footer>
  )
}
