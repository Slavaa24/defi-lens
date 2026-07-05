================================================================
DEFI LENS — FULL PRODUCT SPECIFICATION (MASTER PROMPT)
================================================================
You are building "DeFi Lens" — a DeFi LP analytics and monitoring SaaS.
Free tier: IL calculator, pools explorer, one-off portfolio view.
Pro tier ($8/mo): multi-wallet LP position tracking, real-time IL,
fee earnings, Telegram alerts (out-of-range, IL threshold, APY drop).

Implement it PHASE BY PHASE (phases defined at the end). When asked to
implement a phase, follow this spec exactly, reuse existing code, and
do not stub out things marked as required for that phase.

----------------------------------------------------------------
1. TECH STACK
----------------------------------------------------------------
- Frontend: React 18 + Vite, JavaScript (no TypeScript), React Router v6
- Styling: Tailwind CSS
- Charts: Recharts
- Wallet: wagmi v2 + viem + RainbowKit (connect + Sign-In with Ethereum)
- Backend: Vercel Serverless Functions (Node 20) in /api
- DB: Supabase (Postgres) — used via service-role key ONLY from serverless
  functions, never from the browser
- Auth: SIWE (EIP-4361). Session = httpOnly JWT cookie, 7-day expiry
- Alerts delivery: Telegram Bot API
- Scheduled jobs: Vercel Cron hitting protected /api/cron/* endpoints
- Error tracking: Sentry (frontend + serverless)
- Analytics: Plausible (script tag, no cookies)
- Deploy: Vercel. Repo on GitHub. ESLint + Prettier configured.

ENV VARS (all server-side unless prefixed VITE_):
  SUPABASE_URL, SUPABASE_SERVICE_KEY
  JWT_SECRET
  ALCHEMY_KEY                (Ethereum + Base RPC/API)
  COINGECKO_KEY              (demo tier)
  TELEGRAM_BOT_TOKEN
  CRON_SECRET                (cron endpoints require this as Bearer token)
  COINBASE_COMMERCE_KEY, COINBASE_COMMERCE_WEBHOOK_SECRET
  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_PRO
  SENTRY_DSN, VITE_SENTRY_DSN
  VITE_WALLETCONNECT_PROJECT_ID

----------------------------------------------------------------
2. PROJECT STRUCTURE
----------------------------------------------------------------
/src
  main.jsx, App.jsx (router, providers: wagmi, RainbowKit, QueryClient)
  /pages
    Landing.jsx        — marketing page (route "/")
    Calculator.jsx     — "/calculator"
    Pools.jsx          — "/pools"
    Portfolio.jsx      — "/portfolio" (free one-off view)
    Dashboard.jsx      — "/dashboard" (Pro: positions + alerts) [gated]
    Settings.jsx       — "/settings" (wallets, Telegram link, billing)
    Pricing.jsx        — "/pricing"
    Terms.jsx, Privacy.jsx
  /components
    Header.jsx, Footer.jsx, ConnectButton.jsx, ProGate.jsx,
    TokenSelect.jsx, PoolRow.jsx, PositionCard.jsx, AlertRuleForm.jsx,
    Skeleton.jsx, ErrorState.jsx, EmptyState.jsx, StatCard.jsx
  /services
    api.js             — thin fetch wrapper to /api/*, handles 401→login
    coingecko.js, defillama.js
  /hooks
    useAuth.js, useDebounce.js, usePools.js, usePositions.js
  /utils
    ilMath.js          — pure functions (see §4), unit-tested with Vitest
    format.js          — Intl.NumberFormat helpers ($1.2M, 2-dec %)
    validate.js        — EVM address check, input clamps
/api
  auth/nonce.js, auth/verify.js, auth/logout.js, auth/me.js
  balances.js
  positions/index.js   — GET list, POST refresh
  wallets.js           — GET/POST/DELETE user wallets (Pro: max 5)
  alerts.js            — CRUD alert rules
  telegram/link.js     — issue one-time link code
  telegram/webhook.js  — bot webhook (handles /start <code>)
  billing/coinbase-webhook.js, billing/stripe-webhook.js,
  billing/checkout.js  — creates Stripe session or Coinbase charge
  cron/check-positions.js   — every 10 min
  cron/refresh-prices.js    — every 5 min
  _lib/                — db.js, auth.js (JWT verify), telegram.js,
                         uniswap.js (subgraph queries), prices.js, math.js
/tests
  ilMath.test.js       — required, cover edge cases from §4
vercel.json            — cron schedules, function config

----------------------------------------------------------------
3. DATABASE SCHEMA (Supabase SQL migration)
----------------------------------------------------------------
users(id uuid pk, address text unique not null, created_at,
      plan text default 'free',            -- 'free' | 'pro'
      pro_until timestamptz,
      telegram_chat_id bigint, telegram_linked_at timestamptz)
wallets(id uuid pk, user_id fk, address text, label text,
        created_at, unique(user_id, address))
positions(id uuid pk, wallet_id fk, protocol text, chain text,
          pool_address text, nft_token_id text,      -- v3 NFT id
          token0 jsonb, token1 jsonb,                -- {symbol,address,decimals}
          tick_lower int, tick_upper int, liquidity numeric,
          entry_snapshot jsonb,   -- prices+amounts at first detection
          last_snapshot jsonb,    -- latest computed state (see §5)
          in_range boolean, first_seen timestamptz, updated_at)
alert_rules(id uuid pk, user_id fk, position_id fk nullable,
            type text,   -- 'out_of_range' | 'il_threshold' | 'apy_drop'
            threshold numeric,   -- % for il/apy types
            active boolean default true, created_at)
alert_events(id uuid pk, rule_id fk, fired_at, payload jsonb,
             delivered boolean)
payments(id uuid pk, user_id fk, provider text, provider_ref text unique,
         amount_usd numeric, status text, created_at)
telegram_link_codes(code text pk, user_id fk, expires_at)

Rules: dedupe alerts — a rule may not fire more than once per 6 hours
unless the condition resolved and re-triggered. Store that via
alert_events lookup, not in-memory.

----------------------------------------------------------------
4. IL MATH (utils/ilMath.js + api/_lib/math.js — same logic)
----------------------------------------------------------------
v2 (50/50):
  r = (1+dA)/(1+dB); IL = 2*sqrt(r)/(1+r) - 1
  hodl = amt/2*(1+dA) + amt/2*(1+dB); pool = hodl*(1+IL)
  fees = amt * apy * days/365
v3 (concentrated, for Dashboard positions):
  Given liquidity L, ticks, current sqrtPrice: compute token amounts with
  standard Uniswap v3 formulas (amount0/amount1 from L and price bounds).
  positionValueNow = amount0*price0 + amount1*price1
  hodlValue = entry amounts valued at current prices (from entry_snapshot)
  IL = positionValueNow/hodlValue - 1
  in_range = tickLower <= currentTick < tickUpper
Fees earned (v3): read tokensOwed + feeGrowthInside deltas via subgraph
or Alchemy; if unavailable, show "—" rather than a wrong number.
Edge cases (must be tested): dA or dB = -100% (clamp, show warning),
amt=0, r extremely large, negative days rejected.
Never fabricate data. Any metric that can't be computed reliably
renders as "—" with a tooltip explaining why.

----------------------------------------------------------------
5. FEATURES
----------------------------------------------------------------
5.1 CALCULATOR (free, public)
As previously specced: token pickers with CoinGecko live prices
(debounced search 400ms), amount, per-token price change %, fee APY,
days in position. Outputs: IL%, $ loss, HODL vs Pool cards, fees-vs-IL
verdict (green/red), Recharts line of IL across -80%..+400% for token A,
preset table (±10/±25/±50%, 2x, 5x). State synced to URL query params.
Footnote: "Assumes classic 50/50 AMM. Concentrated liquidity differs."

5.2 POOLS EXPLORER (free, public)
Fetch https://yields.llama.fi/pools once, cache with React Query
(staleTime 10 min). Client-side filters via useMemo: chain (Base,
Ethereum, Arbitrum, Optimism, Polygon), debounced text search on symbol
+ project, min APY, min TVL. Sort: TVL | APY desc. Render 50 rows +
"Load more". Columns: symbol, project, chain badge, TVL compact, APY,
apyPct7D as signed colored delta. Star → watchlist in localStorage
(migrates to DB when user signs in). Row click → drawer with APY
history chart from https://yields.llama.fi/chart/{pool}.
SEO: pre-render routes /pools/base, /pools/ethereum etc. with static
titles/descriptions ("Best liquidity pools on Base — live APY & TVL").

5.3 PORTFOLIO (free, one-off)
Address input (validate 0x+40hex, support ENS via viem). Calls
/api/balances → Alchemy getTokenBalances + metadata on Ethereum + Base,
filters dust (<$1), prices via CoinGecko contract lookup. Show table +
total. CTA card: "Track LP positions & get alerts → Pro".

5.4 AUTH (SIWE)
/api/auth/nonce issues nonce (stored, 5-min TTL). Frontend signs EIP-4361
message via wagmi signMessage. /api/auth/verify checks signature (viem
verifyMessage), upserts user, sets httpOnly JWT cookie. /api/auth/me
returns {address, plan, pro_until, telegram_linked}. All /api routes
except public ones verify JWT. ProGate component wraps Pro pages:
not signed in → connect prompt; free plan → pricing redirect.

5.5 DASHBOARD (Pro)
Wallet manager: up to 5 addresses per user. On add → POST
/api/positions?refresh triggers discovery:
  - Uniswap v3 on Ethereum + Base ONLY for launch. Query the official
    Uniswap v3 subgraphs for positions owned by the address with
    liquidity > 0. Store per §3.
Position cards: pair + fee tier, chain, in-range badge (green "In range" /
red "Out of range"), current value USD, IL vs entry (%, $, colored),
fees earned if available, range visual (min/current/max price bar),
age of position. "Refresh" button (rate-limited: 1/min per user).
Empty state if no positions found; error state on subgraph failure.
Summary row: total LP value, aggregate IL $, count out-of-range.

5.6 ALERTS (Pro)
Rule types:
  out_of_range — fires when in_range flips true→false
  il_threshold — fires when position IL <= -X%
  apy_drop     — watches a DefiLlama pool id, fires when apy < X
CRUD UI in Dashboard (AlertRuleForm). Delivery: Telegram.
Linking flow: Settings → "Link Telegram" → /api/telegram/link returns
one-time code → user opens t.me/<bot>?start=<code> → webhook matches
code, saves chat_id, confirms in chat. Messages are concise:
"⚠️ ETH/USDC 0.05% on Base is OUT OF RANGE. Current price $2,431,
range $2,500–$3,100. Position no longer earning fees."
/api/cron/check-positions (every 10 min, Bearer CRON_SECRET):
refresh all positions of pro users (batch subgraph queries, chunk to
respect limits), recompute §4 metrics, evaluate rules, insert
alert_events, send Telegram messages, mark delivered. Must be
idempotent and respect the 6-hour dedupe rule.

5.7 BILLING
Pricing page: Free vs Pro ($8/mo). Two payment buttons:
  - "Pay with card" → /api/billing/checkout (Stripe Checkout,
    subscription mode). stripe-webhook handles checkout.session.completed
    + invoice.paid → set plan='pro', pro_until = period end;
    customer.subscription.deleted → downgrade at period end.
  - "Pay with USDC" → Coinbase Commerce charge ($8, metadata=user_id).
    Webhook charge:confirmed → pro_until = now + 31 days (non-recurring;
    UI shows expiry date and "Renew" button; 3 days before expiry send
    Telegram reminder if linked).
Verify ALL webhook signatures. Never trust client-reported payment
status. Record every event in payments table.

5.8 LANDING + LEGAL
Landing: hero ("Know your impermanent loss before it knows you"),
3 feature blocks with screenshots, pricing teaser, FAQ (6 questions),
footer. Terms + Privacy pages: plain-language, include "informational
purposes only, not financial advice, data may be delayed or inaccurate,
no liability for trading decisions". Disclaimer line in app footer too.

----------------------------------------------------------------
6. DESIGN SYSTEM
----------------------------------------------------------------
Background #0a0a0a; cards #111 with 1px #1f1f1f border, rounded-xl,
hover border #2e2e2e. Text: primary #f5f5f5, secondary #a1a1aa.
Accent gradient: blue #3b82f6 → indigo #6366f1 (primary buttons).
Positive #22c55e, negative #ef4444, warning #f59e0b. Font: Inter.
Sticky header: logo left, nav center (Calculator, Pools, Portfolio,
Dashboard), ConnectButton right; active tab = gradient underline.
Responsive to 375px; tables collapse to cards on mobile.
Every async view has skeleton, error-with-retry, and empty states.

----------------------------------------------------------------
7. QUALITY BAR
----------------------------------------------------------------
- No API keys in client bundle. Grep check before ship.
- All external calls: timeout 10s, one retry with backoff, cached where
  sane (React Query on client; in-memory + short TTL in functions).
- Rate limit /api/balances and /api/positions per IP/user.
- Input validation server-side on every route (addresses, thresholds).
- ilMath covered by Vitest tests incl. edge cases (§4).
- Sentry wired on both sides; cron failures must be visible in Sentry.
- README: setup, env vars, Supabase migration, Telegram bot setup,
  Stripe/Coinbase webhook setup, Vercel cron config, deploy steps.

----------------------------------------------------------------
8. PHASES (implement in this order, each independently shippable)
----------------------------------------------------------------
Phase 1: Landing, Calculator, Pools, Portfolio (free tier), design
         system, deploy. No auth/db.
Phase 2: SIWE auth, Supabase schema, wallet manager, Uniswap v3
         position discovery + Dashboard (read-only, no alerts).
Phase 3: Telegram linking, alert rules, cron evaluation + delivery.
Phase 4: Billing (Stripe + Coinbase Commerce), ProGate enforcement,
         Settings/billing UI, expiry reminders.
Phase 5: Polish — pool detail drawer, SEO pool pages, watchlist sync,
         Sentry/Plausible, tests, README.
================================================================