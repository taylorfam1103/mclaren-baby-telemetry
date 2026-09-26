create extension if not exists pgcrypto;

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists feeds (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  amount_ml numeric not null check (amount_ml >= 0),
  milk_type text not null check (milk_type in ('breast_milk','formula')),
  note text,
  logged_by text,
  created_at timestamptz not null default now()
);

create table if not exists diapers (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind text not null check (kind in ('wet','dirty','both')),
  note text,
  logged_by text,
  created_at timestamptz not null default now()
);

create table if not exists sleeps (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  note text,
  logged_by text,
  created_at timestamptz not null default now()
);

create table if not exists pumps (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  left_ml numeric not null default 0,
  right_ml numeric not null default 0,
  note text,
  logged_by text,
  created_at timestamptz not null default now()
);

-- Create Mclaren's row, then copy the generated id into NEXT_PUBLIC_BABY_ID.
insert into babies (name, birth_date)
select 'Mclaren', '2026-09-25'
where not exists (select 1 from babies where name = 'Mclaren' and birth_date = '2026-09-25');

-- MVP policy: deliberately simple for initial family-only testing.
-- Before sharing the URL publicly, add Supabase Auth + household RLS.
alter table babies enable row level security;
alter table feeds enable row level security;
alter table diapers enable row level security;
alter table sleeps enable row level security;
alter table pumps enable row level security;

create policy "mvp babies read" on babies for select using (true);
create policy "mvp feeds all" on feeds for all using (true) with check (true);
create policy "mvp diapers all" on diapers for all using (true) with check (true);
create policy "mvp sleeps all" on sleeps for all using (true) with check (true);
create policy "mvp pumps all" on pumps for all using (true) with check (true);
