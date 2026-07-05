# DeFi Lens

DeFi LP analytics and monitoring SaaS. Free tier: impermanent-loss calculator, pools
explorer, one-off portfolio view. Pro tier ($8/mo, upcoming): multi-wallet LP position
tracking with real-time IL, fee earnings and Telegram alerts.

Full specification: [SPEC.md](./SPEC.md). Implementation decisions: [DECISIONS.md](./DECISIONS.md).

**Status: Phase 2 + product deepening** — everything from Phase 1 plus Sign-In with
Ethereum (SIWE), Supabase persistence, wallet manager (up to 5 addresses), a
Dashboard with live Uniswap v3 positions on Ethereum + Base (net P&L, daily value/IL
history), pool detail drawers with APY history and an earnings calculator, pool
comparison, market movers, an account-synced watchlist and saved calculator
scenarios. Alerts and billing arrive in Phases 3–4.

## Stack

React 18 + Vite · Tailwind CSS · React Router v6 · Recharts · wagmi v2 + viem +
RainbowKit · @tanstack/react-query · Cloudflare Pages Functions (`/functions`,
routed under `/api/*`) · Supabase (Postgres) · SIWE + JWT cookie sessions · Vitest

## Setup

```bash
npm install
npm run dev        # Vite dev server (frontend only)
```

The Portfolio and Dashboard pages call `/api/*` Pages Functions.
To run them locally:

```bash
npm run cf:dev     # = npm run build && npx wrangler pages dev
```

Wrangler loads server-side vars from `.dev.vars` or, if absent, from `.env`
(both gitignored; `.dev.vars.example` lists what's needed).

`wrangler pages dev` serves the built SPA from `dist/` together with the
`/api/*` functions on `http://localhost:8788`. Re-run it after frontend
changes (it serves the static build, not the Vite dev server); for pure
UI work keep using `npm run dev`.

### Supabase migration

Create a Supabase project, open the SQL editor and run
[`supabase/migration.sql`](./supabase/migration.sql) once. It creates all tables
(users, wallets, positions, alert rules/events, payments, telegram link codes,
SIWE nonces) with deny-all RLS — only the service-role key used by the Pages
Functions can touch the data. Then run
[`supabase/migration2.sql`](./supabase/migration2.sql), which adds the `watchlist`
table (pool watchlist synced to accounts), and
[`supabase/migration3.sql`](./supabase/migration3.sql), which adds
`position_snapshots` (daily position history, written on every refresh) and
`calc_scenarios` (saved calculator scenarios).

## Environment variables (Phase 2)

Set these in the Cloudflare Pages dashboard (Settings → Variables and Secrets,
encrypt the secrets) or in `.dev.vars` for `wrangler pages dev` — server-side
only unless prefixed `VITE_`:

| Var | Required | Purpose |
|-----|----------|---------|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | yes | service-role key (serverless only, never client) |
| `JWT_SECRET` | yes | signs the httpOnly session cookie (use 64+ random hex chars) |
| `ALCHEMY_KEY` | yes | Ethereum + Base RPC (balances, position discovery, SIWE verify) |
| `COINGECKO_KEY` | no | CoinGecko demo key for higher rate limits |
| `VITE_WALLETCONNECT_PROJECT_ID` | yes | WalletConnect Cloud project id for RainbowKit (build-time, client-safe) |

No secret ever reaches the client bundle; endpoints return a clean 503 when a
required key is missing. Server-side vars are read from Cloudflare bindings
(`context.env`), never from `process.env`.

## Scripts

```bash
npm run dev        # dev server (frontend only)
npm run build      # production build to dist/
npm run preview    # preview the production build (no /api)
npm run cf:dev     # build + wrangler pages dev (SPA + /api functions)
npm run test       # Vitest (ilMath unit tests)
npm run lint       # ESLint
```

## Deploy (Cloudflare Pages)

1. Push to GitHub, then in the Cloudflare dashboard: **Workers & Pages →
   Create → Pages → Connect to Git** and pick the repo.
2. Build settings: framework preset **Vite** (build command `npm run build`,
   output directory `dist` — also pinned in `wrangler.toml` via
   `pages_build_output_dir`). Functions in `functions/` are picked up
   automatically and routed under `/api/*`.
3. Add the env vars above under **Settings → Variables and Secrets**
   (encrypt everything except `VITE_*`). `VITE_*` vars must be present at
   build time; the rest are runtime bindings for the functions.
4. SPA routing needs no config: Pages serves `index.html` for unknown paths
   automatically because the build has no `404.html` (this replaces the old
   `vercel.json` rewrite).

### Scheduled jobs (Cloudflare Workers Cron) — plan for Phase 3

Cloudflare Pages Functions cannot have cron triggers, so the Phase 3
`/api/cron/*` endpoints will be driven by a tiny standalone Worker:

1. The cron endpoints themselves stay in this repo as Pages Functions
   (`functions/api/cron/check-positions.js`, `functions/api/cron/refresh-prices.js`)
   and require `Authorization: Bearer CRON_SECRET`, per SPEC.
2. A separate scheduler Worker (e.g. `defi-lens-cron`, ~15 lines, its own
   `wrangler.toml`) declares the schedules and calls the deployed site:

   ```toml
   # wrangler.toml of the scheduler Worker
   name = "defi-lens-cron"
   main = "src/index.js"
   compatibility_date = "2025-06-01"
   [triggers]
   crons = ["*/10 * * * *", "*/5 * * * *"]   # check-positions, refresh-prices
   ```

   ```js
   export default {
     async scheduled(event, env) {
       const path =
         event.cron === '*/10 * * * *' ? '/api/cron/check-positions' : '/api/cron/refresh-prices'
       await fetch(`${env.APP_URL}${path}`, {
         headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
       })
     },
   }
   ```

3. The Worker gets `APP_URL` (the production Pages URL) and `CRON_SECRET`
   (same value as the Pages project) as secrets: `wrangler secret put CRON_SECRET`.
4. Deploy with `wrangler deploy`; verify runs in the Worker's
   **Logs → Cron Events** tab. The endpoints stay idempotent, so an
   occasional double fire is harmless.

---

DeFi Lens is for informational purposes only and is not financial advice. Data may be
delayed or inaccurate.
