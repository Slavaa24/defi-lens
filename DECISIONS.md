# DECISIONS.md

## DefiLlama proxy (July 2026)

52. **All DefiLlama calls moved server-side** (`/api/pools`, `/api/pool-chart?pool=`)
    because direct browser fetches to yields.llama.fi fail from some regions/ISPs.
    The pools proxy trims the ~18k-pool payload to exactly the fields the UI uses
    (mapping moved from `src/services/defillama.js` to the function) and caches
    per warm isolate for 10 minutes; `Cache-Control: public, max-age=60,
    s-maxage=600` lets the Cloudflare edge absorb most traffic. The chart proxy
    keeps a bounded per-pool cache (200 entries). On upstream failure both serve
    stale cache when available, otherwise a clear 502 — the existing
    error-with-retry states handle it. Consequence: the /pools page now needs
    `wrangler pages dev` locally, like Portfolio/Dashboard (README updated).

## Product deepening (July 2026, pre-Phase 3)

46. **Net P&L = fees − |IL|, gas explicitly ignored.** Computed client-side from the
    stored snapshot (`feesUsd − |ilUsd|`); null (rendered "—") when either side is
    unreliable, per SPEC §4 — an aggregate that silently skipped unknown fees would
    lie. The dashboard stat shows how many positions the aggregate covers
    ("fees − IL, 3/5 positions · gas not incl."), and the per-position breakdown
    popover repeats the gas caveat. Shared via `positionNetPnl()` so card and
    summary can never disagree.

47. **Snapshots: one row per position per UTC day, last refresh wins.**
    `position_snapshots` (migration3) is upserted on `(position_id, day)` inside the
    existing refresh path; a snapshot failure is logged but never sinks the refresh.
    Until the Phase 3 cron exists, history accumulates only on manual refreshes —
    the chart's empty state says exactly that. History endpoint
    (`/api/positions/history`) verifies ownership via a positions→wallets inner
    join before returning rows (max 365 days).

48. **Pool compare is client-only.** All comparison data already sits in the loaded
    /pools rows, so compare is pure UI: checkbox column (max 4, extra boxes disable),
    sticky bottom bar, and a modal table with metrics as rows / pools as columns
    (scrolls horizontally on mobile). 30d trend uses DefiLlama's `apyPct30D`.

49. **"Newly listed" proxied by DefiLlama's `count` field** (days of history the
    aggregator has for the pool, exposed as `dataDays`): ≤ 7 days + TVL > $1M =
    new pool. The pools payload has no listing timestamp; `count` is the closest
    derived-from-dataset signal, as the task requires. Movers (top-3 gainers/losers)
    use `apyPct1D` with the same $1M TVL floor to keep dust pools out.

50. **Drawer earnings projection is linear, not compounded.** daily = amt·APY/365
    etc. at the current APY, labelled as an estimate "before impermanent loss and
    gas". The volatile-pair caveat (ilRisk=yes && !stablecoin) links to
    /calculator?amt=…&apy=…&days=30 — token pickers stay empty because DefiLlama
    symbols don't map reliably to CoinGecko ids.

51. **Saved scenarios reuse the URL-params shape.** `calc_scenarios` (migration3)
    stores exactly the {ta,tas,tb,tbs,amt,da,db,apy,days} strings the calculator
    already serialises to the URL — one format for sharing links and saving, loading
    is just `applyScenario(params)`. POST upserts on (user_id, name) so "Save" over
    an existing name overwrites (button relabels to "Overwrite"); caps: 50 scenarios,
    validated key whitelist server-side. Signed-out users see a sign-in hint instead
    of the manager.

## Product-completeness pass (July 2026, pre-Phase 3)

40. **Watchlist DB sync is additive, not exclusive.** SPEC §5.2 says the localStorage
    watchlist "migrates to DB when user signs in". Implemented as merge-and-mirror:
    on the first signed-in load the localStorage set is POSTed to `/api/watchlist`
    (idempotent upsert), the server's union becomes the source of truth, and it keeps
    mirroring back to localStorage so the list survives signing out. Toggles are
    optimistic; on a failed write the client refetches instead of guessing. New
    `watchlist` table ships in `supabase/migration2.sql` (deny-all RLS like the rest);
    caps: 500 pools per user, 300 ids per merge call.

41. **Pool drawer reads from the already-loaded pools row + one chart call.** Clicking
    a row opens a right-side drawer (full-width under 448px) fed by the row object —
    no second detail request — plus `https://yields.llama.fi/chart/{pool}` for APY
    history (React Query, 10-min staleTime, last 90 points). Extra fields
    (apyBase/apyReward/ilRisk/stablecoin/poolMeta) are now kept when mapping
    `/pools`. The drawer has its own skeleton/error-with-retry/empty states and
    links out to the DefiLlama pool page.

42. **Pricing became a real comparison table.** The two feature cards were replaced
    with a Free/Pro column table (11 feature rows from the §5.7 tier split), prices in
    the header, CTA row at the bottom; the Pro button stays disabled "Coming soon" —
    no payment logic until Phase 4. The table scrolls horizontally inside its card
    below ~430px, keeping 375-px layouts intact.

43. **Per-page titles via a tiny hook, no helmet dependency.** `useDocumentTitle`
    sets `"<Page> · DeFi Lens"` and restores the default on unmount; every routed
    page calls it. SEO pre-rendered /pools/{chain} pages remain Phase 5 scope.

44. **Landing gained a "How it works" section** (3 numbered steps: model → pick →
    monitor) between features and the pricing teaser; hero tagline (§5.8), 3 feature
    cards with styled UI mockups, FAQ (6) and CTAs into Calculator/Pools were already
    in place from Phase 1 and were kept.

45. **Privacy policy updated for the synced watchlist** (was "localStorage only").
    Footer now carries product + legal nav and a "Data by DefiLlama & CoinGecko"
    attribution line alongside the §5.8 disclaimer, which renders on every page.

## Deployment migration: Vercel → Cloudflare Pages (July 2026)

33. **Handlers rewritten to the Fetch API, business logic untouched.** Vercel's
    Node `(req, res)` handlers became Pages Functions exporting `onRequest(context)`
    that return `Response` objects. Every route keeps its path (`/api/...`), methods,
    status codes, error messages, cookies and JSON shapes byte-for-byte where possible;
    all DB/RPC/pricing/math logic was copied verbatim (env threading aside). The
    frontend needed no changes beyond one dev-hint string in `src/services/api.js`.

34. **Env vars via `context.env`, not `process.env`.** Workers expose bindings per
    request, so `_lib` helpers now take `env` as a parameter (`getDb(env)`,
    `discoverPositions(owner, env)`, …). Locally they come from `.dev.vars`
    (`.dev.vars.example` committed, real file gitignored); in production from
    Pages project secrets.

35. **`Secure` cookie flag derived from the request protocol** instead of
    `VERCEL_ENV`: https → `Secure`, plain-http `wrangler pages dev` → not, matching
    the old prod/dev behaviour without a platform-specific env var.

36. **Shared code stays in `functions/api/_lib/`.** Pages Functions do not create
    routes for underscore-prefixed files/dirs, and these modules export no
    `onRequest` anyway, so they are import-only — the old `/api/_lib` layout and
    relative imports survive unchanged.

37. **`vercel.json` deleted with no replacement.** Cloudflare Pages serves
    `index.html` for unknown paths automatically when the build contains no
    `404.html`, which is exactly the old SPA rewrite. `wrangler.toml` only pins
    the output dir (`dist`) and enables `nodejs_compat` as a safety net for
    transitive Node imports in dependencies.

38. **Cron becomes a separate scheduler Worker (documented, built in Phase 3).**
    Pages Functions can't own cron triggers, so the plan (README "Scheduled jobs")
    is a tiny standalone Worker with two Cron Triggers that calls the deployed
    `/api/cron/*` endpoints with `Bearer CRON_SECRET`. The endpoints themselves
    stay in this repo, keeping all logic in one place; SPEC §1 updated accordingly.

39. **In-memory rate limits/caches keep their old semantics.** The per-instance
    Maps in `/api/balances` now live per warm Workers isolate — the same
    best-effort guarantee as per warm Vercel lambda (decision 10). A durable
    store is still the Phase 3+ upgrade path.

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
