-- DeFi Lens — migration 2: pool watchlist synced to accounts.
-- Run in the Supabase SQL editor after migration.sql.
-- pool_id is the DefiLlama pool identifier (uuid-style string) used across
-- the Pools Explorer; the localStorage watchlist merges into this table the
-- first time a signed-in user loads the explorer.

create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pool_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, pool_id)
);

create index if not exists idx_watchlist_user on watchlist(user_id);

-- Deny-all RLS, same policy as every other table: only the service-role key
-- (Pages Functions only) can read or write.
alter table watchlist enable row level security;
