# DeFi Lens

DeFi LP analytics and monitoring SaaS. Free tier: impermanent-loss calculator, pools
explorer, one-off portfolio view. Pro tier ($8/mo, upcoming): multi-wallet LP position
tracking with real-time IL, fee earnings and Telegram alerts.

Full specification: [SPEC.md](./SPEC.md). Implementation decisions: [DECISIONS.md](./DECISIONS.md).

**Status: Phase 2** — everything from Phase 1 plus Sign-In with Ethereum (SIWE),
Supabase persistence, wallet manager (up to 5 addresses) and a read-only Dashboard
with live Uniswap v3 positions on Ethereum + Base. Alerts and billing arrive in
Phases 3–4.

## Stack

React 18 + Vite · Tailwind CSS · React Router v6 · Recharts · wagmi v2 + viem +
RainbowKit · @tanstack/react-query · Vercel Serverless Functions (`/api`) ·
Supabase (Postgres) · SIWE + JWT cookie sessions · Vitest

## Setup

```bash
npm install
npm run dev        # Vite dev server (frontend only)
```

The Portfolio and Dashboard pages call `/api/*` serverless functions.
To run them locally:

```bash
npm i -g vercel
vercel dev         # serves the SPA + /api functions together
```

### Supabase migration

Create a Supabase project, open the SQL editor and run
[`supabase/migration.sql`](./supabase/migration.sql) once. It creates all tables
(users, wallets, positions, alert rules/events, payments, telegram link codes,
SIWE nonces) with deny-all RLS — only the service-role key used by the serverless
functions can touch the data.

## Environment variables (Phase 2)

Set these in Vercel (or `.env` for `vercel dev`) — server-side only unless
prefixed `VITE_`:

| Var | Required | Purpose |
|-----|----------|---------|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | yes | service-role key (serverless only, never client) |
| `JWT_SECRET` | yes | signs the httpOnly session cookie (use 64+ random hex chars) |
| `ALCHEMY_KEY` | yes | Ethereum + Base RPC (balances, position discovery, SIWE verify) |
| `COINGECKO_KEY` | no | CoinGecko demo key for higher rate limits |
| `VITE_WALLETCONNECT_PROJECT_ID` | yes | WalletConnect Cloud project id for RainbowKit |

No secret ever reaches the client bundle; endpoints return a clean 503 when a
required key is missing.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run test       # Vitest (ilMath unit tests)
npm run lint       # ESLint
```

## Deploy

Push to GitHub and import the repo in Vercel — framework preset "Vite".
`vercel.json` already contains the SPA rewrite (everything except `/api/*` → `index.html`).
Add the env vars above in the Vercel project settings.

---

DeFi Lens is for informational purposes only and is not financial advice. Data may be
delayed or inaccurate.
