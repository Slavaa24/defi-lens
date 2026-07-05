# DeFi Lens

DeFi LP analytics and monitoring SaaS. Free tier: impermanent-loss calculator, pools
explorer, one-off portfolio view. Pro tier ($8/mo, upcoming): multi-wallet LP position
tracking with real-time IL, fee earnings and Telegram alerts.

Full specification: [SPEC.md](./SPEC.md). Implementation decisions: [DECISIONS.md](./DECISIONS.md).

**Status: Phase 1** — Landing, Calculator, Pools, Portfolio (free tier), design system.
No auth/DB yet.

## Stack

React 18 + Vite · Tailwind CSS · React Router v6 · Recharts · wagmi v2 + viem ·
@tanstack/react-query · Vercel Serverless Functions (`/api`) · Vitest

## Setup

```bash
npm install
npm run dev        # Vite dev server (frontend only)
```

The Portfolio page calls `/api/balances`, which is a Vercel serverless function.
To run it locally:

```bash
npm i -g vercel
vercel dev         # serves the SPA + /api functions together
```

## Environment variables (Phase 1)

Set these in Vercel (or `.env` for `vercel dev`) — all server-side only:

| Var | Required | Purpose |
|-----|----------|---------|
| `ALCHEMY_KEY` | yes (for Portfolio) | Ethereum + Base RPC for token balances |
| `COINGECKO_KEY` | no | CoinGecko demo key for higher rate limits |

No key ever reaches the client bundle; `/api/balances` returns a clean 503 if
`ALCHEMY_KEY` is missing.

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
