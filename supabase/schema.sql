-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query)
create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  budget numeric not null,
  currency text not null default 'INR',
  travelers int not null default 1,
  travel_style text default 'solo',
  pace text default 'balanced',
  accommodation_level text default 'mid-range',
  interests text[] not null default '{}',
  notes text not null default '',
  itinerary jsonb not null default '{}'::jsonb,
  cover jsonb,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_idx on public.trips (user_id, created_at desc);

alter table public.trips enable row level security;

create policy "Owners can read their trips" on public.trips
  for select using (auth.uid() = user_id);
create policy "Owners can insert their trips" on public.trips
  for insert with check (auth.uid() = user_id);
create policy "Owners can update their trips" on public.trips
  for update using (auth.uid() = user_id);
create policy "Owners can delete their trips" on public.trips
  for delete using (auth.uid() = user_id);

-- The FastAPI backend uses the service-role key (bypasses RLS) and always
-- filters by the verified user id; RLS protects direct client access.
