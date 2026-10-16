-- BidRadar database schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create extension if not exists "pgcrypto";

-- One row per user, created automatically on sign-up.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  company_name text,
  description text,
  keywords text[] not null default '{}',
  exclude_keywords text[] not null default '{}',
  regions text[] not null default '{}',
  cpv_prefixes text[] not null default '{}',
  min_value numeric,
  max_value numeric,
  onboarded boolean not null default false,
  subscription_status text not null default 'trialing',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public tender notices collected by the agent.
create table public.tenders (
  id text primary key,
  source text not null,
  notice_id text,
  title text not null,
  description text,
  buyer text,
  value_amount numeric,
  currency text,
  deadline timestamptz,
  published_at timestamptz,
  url text,
  cpv_codes text[] not null default '{}',
  regions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tenders_created_at_idx on public.tenders (created_at desc);
create index tenders_deadline_idx on public.tenders (deadline);

-- A tender the agent has shortlisted for a user.
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tender_id text not null references public.tenders(id) on delete cascade,
  score int not null check (score between 0 and 100),
  verdict text not null,
  reasons text[] not null default '{}',
  risks text[] not null default '{}',
  summary text,
  requirements text[] not null default '{}',
  draft text,
  status text not null default 'new'
    check (status in ('new', 'interested', 'bidding', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (user_id, tender_id)
);
create index matches_user_created_idx on public.matches (user_id, created_at desc);

-- Log of agent jobs, for your own monitoring.
create table public.agent_runs (
  id bigint generated always as identity primary key,
  kind text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row level security: users only ever see their own data.
alter table public.profiles enable row level security;
alter table public.tenders enable row level security;
alter table public.matches enable row level security;
alter table public.agent_runs enable row level security;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Users may only edit their business details, never billing fields.
revoke update on public.profiles from authenticated, anon;
grant update (company_name, description, keywords, exclude_keywords, regions,
              cpv_prefixes, min_value, max_value, onboarded, updated_at)
  on public.profiles to authenticated;

create policy "Signed-in users read tenders" on public.tenders
  for select to authenticated using (true);

create policy "Users read own matches" on public.matches
  for select using (auth.uid() = user_id);
create policy "Users update own matches" on public.matches
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users may only change a match's status.
revoke update on public.matches from authenticated, anon;
grant update (status) on public.matches to authenticated;

-- agent_runs has no policies, so only the service role (the agent) can use it.
