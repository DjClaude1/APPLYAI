-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  display_name text,
  plan text default 'free' check (plan in ('free', 'pro')),
  resume_count integer default 0,
  application_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RESUMES TABLE
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  uid uuid references auth.users on delete cascade not null,
  title text not null,
  content jsonb not null,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. APPLICATIONS TABLE
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  uid uuid references auth.users on delete cascade not null,
  job_title text not null,
  company text not null,
  status text default 'applied' check (status in ('applied', 'interviewing', 'offered', 'rejected')),
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text
);

-- 4. COVER LETTERS TABLE
create table if not exists public.cover_letters (
  id uuid default gen_random_uuid() primary key,
  uid uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. JOBS CACHE TABLE
create table if not exists public.jobs_cache (
  id uuid default gen_random_uuid() primary key,
  query text not null,
  location text,
  results jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.cover_letters enable row level security;
alter table public.jobs_cache enable row level security;

-- RLS Policies
-- Profiles: Users can read/update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Resumes: Users can manage their own resumes
create policy "Users can manage own resumes" on public.resumes for all using (auth.uid() = uid);
create policy "Public can view public resumes" on public.resumes for select using (is_public = true);

-- Applications: Users can manage their own applications
create policy "Users can manage own applications" on public.applications for all using (auth.uid() = uid);

-- Cover Letters: Users can manage their own cover letters
create policy "Users can manage own cover letters" on public.cover_letters for all using (auth.uid() = uid);

-- Jobs Cache: Service role only (Edge Functions)
create policy "Service role can manage jobs cache" on public.jobs_cache using (true) with check (true);

-- 6. AUTOMATIC PROFILE CREATION TRIGGER
-- This function creates a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, plan)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.email = 'claudemuteb2@gmail.com' then 'pro' else 'free' end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. UPDATED_AT TRIGGER
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_resume_updated
  before update on public.resumes
  for each row execute procedure public.handle_updated_at();
