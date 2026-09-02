-- Pluss.dev lead capture
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  business_name text not null,
  phone text not null,
  email text not null,
  city text,
  business_type text,
  service text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'booked', 'won', 'lost')),
  notes text,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

alter table public.leads enable row level security;

drop policy if exists "Anyone can submit a lead" on public.leads;
create policy "Anyone can submit a lead"
on public.leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "Signed-in users can read leads" on public.leads;
create policy "Signed-in users can read leads"
on public.leads
for select
to authenticated
using (true);

drop policy if exists "Signed-in users can update leads" on public.leads;
create policy "Signed-in users can update leads"
on public.leads
for update
to authenticated
using (true)
with check (true);

alter table public.leads replica identity full;

alter table public.leads add column if not exists service text;

do $$
begin
  alter publication supabase_realtime add table public.leads;
exception
  when duplicate_object then null;
end $$;
