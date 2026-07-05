import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-edge mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-txt-secondary">
            <span>⚡</span>
            <span className="font-semibold text-txt-primary">DeFi Lens</span>
            <span>· LP analytics & IL monitoring</span>
          </div>
          <nav className="flex items-center gap-5 text-sm text-txt-secondary">
            <Link to="/pricing" className="hover:text-txt-primary transition-colors">
              Pricing
            </Link>
            <Link to="/terms" className="hover:text-txt-primary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-txt-primary transition-colors">
              Privacy
            </Link>
          </nav>
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
