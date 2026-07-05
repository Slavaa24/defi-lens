import useDocumentTitle from '../hooks/useDocumentTitle'

export default function Terms() {
  useDocumentTitle('Terms of Service')
  return (
    <div className="max-w-2xl mx-auto prose-invert">
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      <div className="flex flex-col gap-5 text-sm text-txt-secondary leading-relaxed">
        <p className="text-xs text-zinc-600">Last updated: July 5, 2026</p>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">What DeFi Lens is</h2>
          <p>
            DeFi Lens is an analytics tool for decentralized-finance liquidity providers. It shows
            calculations, market data and information about public blockchain addresses. It never
            holds your funds, never asks for private keys, and cannot move assets on your behalf.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Not financial advice</h2>
          <p>
            Everything on this site is for informational purposes only and is not financial,
            investment, legal or tax advice. Providing liquidity, trading and holding crypto
            assets are risky — you can lose everything you deposit. Do your own research and make
            your own decisions.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Data can be wrong</h2>
          <p>
            Prices, APYs, balances and loss estimates come from third-party sources (CoinGecko,
            DefiLlama, blockchain RPC providers) and from simplified mathematical models. Data may
            be delayed, incomplete or inaccurate. Where we can’t compute something reliably we show
            “—”, but we can’t guarantee anything shown is correct.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">No liability</h2>
          <p>
            To the maximum extent permitted by law, DeFi Lens and its operators accept no liability
            for any losses or damages arising from your use of the site, including trading or
            liquidity-provision decisions made based on information shown here.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Paid plans</h2>
          <p>
            Pro subscriptions, when available, are billed in advance and grant access to Pro
            features for the paid period. We may change features or pricing with notice on this
            site.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Fair use</h2>
          <p>
            Don’t abuse the service: no scraping at disruptive rates, no attempts to break
            authentication, no illegal use. We may restrict access that harms the service or other
            users.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Changes</h2>
          <p>
            We may update these terms; the current version always lives at this page. Continuing to
            use the site after changes means you accept them.
          </p>
        </section>
      </div>
    </div>
  )
}
