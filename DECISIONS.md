# DECISIONS.md — Phase 1

Assumptions and judgement calls made while implementing Phase 1
(Landing, Calculator, Pools, Portfolio, design system — no auth/DB).

1. **CRA → Vite migration.** The repo contained an older Create React App prototype
   (React 19 + react-scripts). SPEC §1 mandates React 18 + Vite, so the project was
   migrated: new `package.json`, Vite/Tailwind/PostCSS configs, `src` restructured to
   `pages/components/services/hooks/utils`. The old prototype's IL formula and UI ideas
   were carried over; its files were removed.

2. **ConnectButton without RainbowKit in Phase 1.** The header design requires a
   ConnectButton, but auth (SIWE) is Phase 2. Implemented a lightweight wagmi
   `injected()` connect/disconnect button. RainbowKit (and WalletConnect, which needs
   `VITE_WALLETCONNECT_PROJECT_ID`) will be added in Phase 2 together with SIWE, per
   the stack in SPEC §1.

3. **Dashboard route is a teaser, not a stub.** SPEC §6 puts "Dashboard" in the main
   nav, but the Pro dashboard is Phase 2. `/dashboard` renders a proper page (EmptyState
   with links to Pricing/Portfolio) instead of a 404 or a broken stub.

4. **Pricing page included as static.** `Pricing.jsx` is listed in SPEC §2 and the
   landing needs a pricing teaser target, but billing is Phase 4. The page shows the
   Free vs Pro ($8/mo) comparison with a disabled "Coming soon" Pro button; payment
   buttons arrive in Phase 4.

5. **Terms & Privacy shipped in Phase 1.** SPEC §5.8 groups them with the Landing
   ("LANDING + LEGAL"), so both plain-language pages (with the required disclaimers)
   are included even though the phase list doesn't name them explicitly.

6. **CoinGecko from the client without a key.** The calculator's token search/prices
   use public keyless CoinGecko endpoints from the browser (SPEC lists `COINGECKO_KEY`
   as server-side only, and no API keys may reach the client bundle). The server-side
   `/api/balances` uses `COINGECKO_KEY` when present.

7. **Portfolio needs `vercel dev` locally.** `/api/balances` is a Vercel serverless
   function; plain `npm run dev` (Vite) doesn't serve it. The API client returns a
   clear error pointing to `vercel dev`. If `ALCHEMY_KEY` is unset the endpoint
   responds 503 with a human-readable message rather than fabricating data.

8. **Native ETH included in balances.** SPEC §5.3 mentions `getTokenBalances +
   metadata`; native ETH on both chains is also fetched (via `eth_getBalance`) since a
   portfolio without ETH would be misleading. Unpriced tokens (no CoinGecko contract
   price — usually spam) are hidden along with sub-$1 dust rather than shown with fake
   values.

9. **Balances metadata capped at 50 tokens per chain.** Alchemy metadata is one call
   per contract; the cap keeps the function fast and within rate limits. Tokens are
   taken in the order Alchemy returns them; dust filtering happens after pricing.

10. **Rate limiting / caching are in-memory.** SPEC §7 asks for rate limits and
    caching on `/api/balances`; without a DB in Phase 1 they're per-instance in-memory
    (60s response cache, 20 req/10min per IP). Good enough for launch; can move to
    Redis/Supabase later.

11. **Calculator computes live, no "Calculate" button.** Results, chart, verdict and
    preset table update as you type, and the full state syncs to URL query params
    (`ta,tas,tb,tbs,amt,da,db,apy,days`) per SPEC §5.1. Token symbol is stored in the
    URL alongside the id so shared links render without an extra API call.

12. **Preset table applies scenarios to Token A** (±10/±25/±50%, 2x, 5x) with Token B's
    change fixed at the current input — consistent with the chart's definition.

13. **−100% clamp.** Price changes ≤ −100% are clamped to −99.99% (`MIN_DELTA`) with a
    visible warning, per SPEC §4. Negative "days in position" shows a validation error
    and disables the fee projection.

14. **Fees vs IL verdict horizon.** Fee earnings use `amt * apy * days/365` (SPEC §4)
    over the user-entered "days in position" (default 30), and the verdict compares
    those fees against IL in dollars.

15. **Pools: watchlist filter chip added.** SPEC §5.2 requires starring to
    localStorage; a "★ Watchlist" filter chip was added so stars are actually useful.
    DB migration of the watchlist happens in Phase 2+. Pool detail drawer and SEO
    pre-rendered chain pages are deferred to Phase 5 per the phase list.

16. **Pools list limited to the five spec chains** (Base, Ethereum, Arbitrum, Optimism,
    Polygon) with an "All" chip; "7d Δ" column uses `apyPct7D` as a signed colored
    delta; rows collapse to cards below `md` (SPEC §6 mobile requirement).

17. **ilMath tests shipped now.** SPEC §2/§4 mark `ilMath.js` as unit-tested with
    required edge cases, so Vitest + `tests/ilMath.test.js` are included in Phase 1
    even though the phase list mentions tests again in Phase 5.

18. **Landing feature "screenshots" are stylized CSS mockups.** No real product
    screenshots exist yet; small hand-built mock panels represent each feature and can
    be swapped for real screenshots in Phase 5 polish.

19. **Deploy left to the user.** Per the working agreement (no push/deploy),
    `vercel.json` (SPA rewrite excluding `/api/*`), README deploy steps and env-var
    table are provided instead of an actual deployment.

20. **Sentry/Plausible deferred to Phase 5** as listed in the phase plan, even though
    they appear in the general stack (§1).
