-- DeFi Lens — Supabase schema (SPEC §3)
-- Run in the Supabase SQL editor (or `psql`) once per project.
-- All access goes through serverless functions with the service-role key;
-- RLS is enabled with no policies so anon/authenticated roles can read nothing.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  address text unique not null,
  created_at timestamptz not null default now(),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  pro_until timestamptz,
  telegram_chat_id bigint,
  telegram_linked_at timestamptz,
  -- server-side rate limit for manual position refresh (1/min per user)
  last_refresh_at timestamptz
);

create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  address text not null,
  label text,
  created_at timestamptz not null default now(),
  unique (user_id, address)
);

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  protocol text not null,              -- 'uniswap_v3'
  chain text not null,                 -- 'Ethereum' | 'Base'
  pool_address text not null,
  nft_token_id text not null,          -- v3 NFT id
  token0 jsonb not null,               -- {symbol,address,decimals}
  token1 jsonb not null,
  tick_lower int not null,
  tick_upper int not null,
  liquidity numeric not null,
  entry_snapshot jsonb,                -- prices+amounts at first detection
  last_snapshot jsonb,                 -- latest computed state (SPEC §5)
  in_range boolean,
  first_seen timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one row per NFT per chain per wallet, enables idempotent upserts
  unique (wallet_id, chain, nft_token_id)
);

create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  position_id uuid references positions(id) on delete cascade,
  type text not null check (type in ('out_of_range', 'il_threshold', 'apy_drop')),
  threshold numeric,                   -- % for il/apy types
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists alert_events (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references alert_rules(id) on delete cascade,
  fired_at timestamptz not null default now(),
  payload jsonb,
  delivered boolean not null default false
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,              -- 'stripe' | 'coinbase'
  provider_ref text unique not null,
  amount_usd numeric,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists telegram_link_codes (
  code text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);

-- SIWE nonces (SPEC §5.4: nonce stored server-side, 5-min TTL).
-- A table (not memory) because serverless instances don't share state.
create table if not exists siwe_nonces (
  nonce text primary key,
  expires_at timestamptz not null
);

create index if not exists idx_wallets_user on wallets(user_id);
create index if not exists idx_positions_wallet on positions(wallet_id);
create index if not exists idx_alert_rules_user on alert_rules(user_id);
create index if not exists idx_alert_events_rule_fired on alert_events(rule_id, fired_at desc);
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_link_codes_user on telegram_link_codes(user_id);

-- Deny-all RLS: the service-role key (serverless only) bypasses RLS;
-- anon/authenticated browser keys — which we never ship — can access nothing.
alter table users enable row level security;
alter table wallets enable row level security;
alter table positions enable row level security;
alter table alert_rules enable row level security;
alter table alert_events enable row level security;
alter table payments enable row level security;
alter table telegram_link_codes enable row level security;
alter table siwe_nonces enable row level security;
