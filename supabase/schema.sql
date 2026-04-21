-- ==========================================================================
-- ApplyAI — Supabase schema
-- Run this entire file in Supabase → SQL Editor → New query → Run
-- ==========================================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  paypal_subscription_id text,
  monthly_generations integer not null default 0,
  monthly_period_start timestamptz not null default date_trunc('month', now()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generation history (for user's own records + future export)
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references auth.users on delete cascade,
  job_description text not null,
  resume_input text not null,
  result jsonb not null,
  match_score integer,
  created_at timestamptz not null default now()
);

-- Idempotency log for PayPal webhook events
create table if not exists public.paypal_events (
  id text primary key,
  event_type text not null,
  resource jsonb,
  received_at timestamptz not null default now()
);

-- Payment log (for receipts / ops)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  paypal_event_id text,
  paypal_subscription_id text,
  amount numeric,
  currency text,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Row Level Security
-- ==========================================================================
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.paypal_events enable row level security;
alter table public.payments enable row level security;

-- Profiles: users can only see/update their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Generations: users can see their own history
drop policy if exists "generations_select_own" on public.generations;
create policy "generations_select_own" on public.generations
  for select using (auth.uid() = uid);

-- NOTE: inserts into profiles / generations / paypal_events / payments are
-- performed by the server using the service-role key, which bypasses RLS.

-- ==========================================================================
-- Auto-create profile row on new auth user signup
-- ==========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================================================
-- Atomic quota enforcement — eliminates the read/check/increment race.
-- Returns (allowed, plan, used). If allowed=true the counter has already
-- been incremented; if the subsequent Gemini call fails, call
-- refund_generation() to roll it back.
-- ==========================================================================
create or replace function public.try_consume_generation(
  p_uid uuid,
  p_limit integer,
  p_email text default null
)
returns table(allowed boolean, plan text, used integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_period_start timestamptz;
  v_plan text;
  v_monthly integer;
begin
  insert into public.profiles (id, email)
    values (p_uid, p_email)
    on conflict (id) do nothing;

  select p.plan, p.monthly_generations, p.monthly_period_start
    into v_plan, v_monthly, v_period_start
    from public.profiles p
    where p.id = p_uid
    for update;

  if date_trunc('month', v_period_start) <> date_trunc('month', v_now) then
    v_monthly := 0;
    v_period_start := date_trunc('month', v_now);
  end if;

  if v_plan = 'pro' or v_monthly < p_limit then
    update public.profiles
      set monthly_generations = v_monthly + 1,
          monthly_period_start = v_period_start,
          updated_at = v_now
      where id = p_uid;
    return query select true, v_plan, v_monthly + 1;
  else
    return query select false, v_plan, v_monthly;
  end if;
end;
$$;

create or replace function public.refund_generation(p_uid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
    set monthly_generations = greatest(0, monthly_generations - 1),
        updated_at = now()
    where id = p_uid;
end;
$$;

revoke all on function public.try_consume_generation(uuid, integer, text) from public, anon;
revoke all on function public.refund_generation(uuid) from public, anon;
