export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <div className="flex flex-col gap-5 text-sm text-txt-secondary leading-relaxed">
        <p className="text-xs text-zinc-600">Last updated: July 5, 2026</p>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">The short version</h2>
          <p>
            We collect as little as possible. The free tools work without accounts, cookies for
            tracking, or personal data. Wallet addresses you look up are public blockchain data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">What we process</h2>
          <p>
            Addresses you enter are sent to our servers and third-party data providers (blockchain
            RPCs, CoinGecko, DefiLlama) to fetch balances and prices. Your watchlist is stored only
            in your browser’s localStorage. Standard server logs (IP address, request path) are
            kept briefly for abuse prevention and debugging.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Accounts (Pro)</h2>
          <p>
            When Pro launches, signing in with your wallet stores your address, plan status, the
            wallets you choose to track, your alert rules and — if you link it — your Telegram chat
            id, solely to deliver the service. Payments are processed by Stripe or Coinbase
            Commerce; we never see card numbers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">What we don’t do</h2>
          <p>
            We don’t sell your data, we don’t run ad trackers, and we never ask for private keys or
            seed phrases. Anyone asking for those in our name is scamming you.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Analytics</h2>
          <p>
            We use (or plan to use) privacy-friendly, cookie-less analytics to count page views in
            aggregate. No cross-site tracking, no personal profiles.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-txt-primary mb-1.5">Contact & changes</h2>
          <p>
            Questions or deletion requests: reach out via the contact listed on our GitHub
            repository. We may update this policy; the current version always lives at this page.
          </p>
        </section>
      </div>
    </div>
  )
}
