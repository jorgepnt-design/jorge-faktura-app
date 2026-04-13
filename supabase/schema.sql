-- ═══════════════════════════════════════════════════════════════════
-- Jorge Faktura – Supabase Schema
-- Run once in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create table (one row per user, all business data as JSONB)
create table if not exists public.user_data (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}',
  updated_at timestamptz not null default now()
);

-- 2. Row Level Security (users can only access their own row)
alter table public.user_data enable row level security;

create policy "select own data" on public.user_data
  for select using ( auth.uid() = user_id );

create policy "insert own data" on public.user_data
  for insert with check ( auth.uid() = user_id );

create policy "update own data" on public.user_data
  for update using ( auth.uid() = user_id );

create policy "delete own data" on public.user_data
  for delete using ( auth.uid() = user_id );
