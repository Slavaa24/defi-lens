-- DeFi Lens — migration 3: position history snapshots + saved calculator scenarios.
-- Run in the Supabase SQL editor after migration.sql and migration2.sql.

-- One row per position per UTC day, written whenever positions are refreshed.
-- Until the Phase 3 cron exists, snapshots accumulate only on manual refreshes;
-- the same-day row is overwritten so the last refresh of a day wins.
create table if not exists position_snapshots (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references positions(id) on delete cascade,
  day date not null,
  value_usd numeric,
  il_pct numeric,
  il_usd numeric,
  fees_usd numeric,
  in_range boolean,
  created_at timestamptz not null default now(),
  unique (position_id, day)
);

create index if not exists idx_position_snapshots_pos_day
  on position_snapshots(position_id, day desc);

-- Named IL-calculator scenarios for signed-in users. `params` mirrors the
-- calculator's URL params ({ta,tas,tb,tbs,amt,da,db,apy,days} — all strings).
create table if not exists calc_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  params jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_calc_scenarios_user on calc_scenarios(user_id);

-- Deny-all RLS like every other table: only the service-role key
-- (Pages Functions only) can read or write.
alter table position_snapshots enable row level security;
alter table calc_scenarios enable row level security;
