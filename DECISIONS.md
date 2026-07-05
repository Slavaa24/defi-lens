# DECISIONS.md

## Phase 2 (SIWE auth, Supabase, wallet manager, Dashboard)

21. **On-chain discovery instead of subgraphs.** SPEC §5.5 says to query the official
    Uniswap v3 subgraphs, but The Graph's hosted service was sunset and gateway queries
    now require a separate `THEGRAPH_API_KEY`, which isn't among the configured env
    vars. Positions are discovered by reading the NonfungiblePositionManager, factory
    and pool contracts directly over Alchemy RPC (viem with batched multicall) — exact
    data, one existing key. Fees are computed from `tokensOwed` + `feeGrowthInside`
    deltas per SPEC §4; if any tick read fails, fees render as "—", never a wrong number.

22. **SIWE via `viem/siwe`, sessions via `jose`.** No separate `siwe` package: viem
    ships EIP-4361 helpers (message build/parse/validate + `generateSiweNonce`).
    Signature check uses `publicClient.verifyMessage`, which also covers ERC-1271
    smart-contract wallets and ERC-6492 pre-deploy signatures. The session is an HS256
    JWT (`jose`) in an httpOnly `dl_session` cookie, 7-day expiry, `SameSite=Lax`,
    `Secure` in production (SPEC §1).

23. **Nonces live in a `siwe_nonces` table.** SPEC §5.4 says nonces are "stored, 5-min
    TTL"; serverless instances share no memory, so a table is the only reliable store.
    Nonces are single-use (deleted on verify) and expired rows are cleaned up
    opportunistically. The table is an addition to the §3 schema.

24. **Two small schema extensions.** (a) `users.last_refresh_at` backs the
    once-per-minute refresh rate limit durably (in-memory limits reset per instance);
    (b) `unique(wallet_id, chain, nft_token_id)` on `positions` makes refresh upserts
    idempotent. Everything else matches §3 exactly. RLS is enabled deny-all on every
    table: only the service-role key (serverless-only) can read or write.

25. **Fee tier stored inside the `token0` jsonb.** §3 has no `fee` column, but §5.5
    requires displaying "pair + fee tier". Rather than deviating from the schema, the
    tier is kept as `token0.fee` (it's immutable per NFT).

26. **ProGate ships with plan enforcement off.** §5.4 says free-plan users get
    redirected to /pricing, but billing doesn't exist until Phase 4 — with enforcement
    on, nobody could use the dashboard at all. ProGate requires sign-in now and has a
    single `PRO_ENFORCED` flag to flip in Phase 4 (whose scope explicitly includes
    "ProGate enforcement").

27. **Wallet-scoped refresh bypasses the 1/min cooldown.** Adding a wallet triggers
    discovery for that wallet immediately (§5.5); if that call shared the global
    cooldown, adding two wallets in a row would silently skip discovery for the second.
    The bypass is naturally bounded by the 5-wallet cap; the manual "Refresh" button
    (all wallets) keeps the strict 1/min limit enforced server-side via
    `users.last_refresh_at` and mirrored client-side with a countdown.

28. **Closed positions are deleted, cautiously.** A refresh removes rows whose NFT is
    gone or has zero liquidity — but only for chains whose discovery succeeded, so an
    RPC outage on one chain can't wipe that chain's stored positions. Per-chain errors
    surface in the dashboard as a warning banner instead of failing the whole refresh.

29. **Entry snapshot = first detection.** IL is measured against the amounts/prices at
    the moment DeFi Lens first saw the position (SPEC §3 "prices+amounts at first
    detection"), not at mint — mint-time data would require historical archive queries.
    The IL tooltip says exactly that. Metrics missing a reliable input (token without a
    CoinGecko price, failed fee read) render as "—" with an explanatory tooltip (§4).

30. **Discovery caps at 50 position NFTs per wallet per chain** to bound RPC fan-out;
    position amounts use float math (double precision) since results feed USD displays,
    not transactions.

31. **v3 math lives server-side only.** §4 lists v3 formulas under Dashboard positions;
    all v3 computation happens in `api/_lib/math.js` during refresh and is stored in
    snapshots — the client only formats. `utils/ilMath.js` (v2, calculator) stays
    unchanged and shared logic duplication is avoided.

32. **RainbowKit added per the §1 stack** (deferred from Phase 1, see decision 2), with
    a dark theme matched to the design system. The custom-styled ConnectButton shows a
    three-state flow: Connect → Sign in (SIWE) → signed-in address chip; signing out
    clears the session cookie but leaves the wallet connected.

## Phase 1 (Landing, Calculator, Pools, Portfolio, design system)

Assumptions and judgement calls made while implementing Phase 1.

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
