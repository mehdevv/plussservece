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
drop policy if exists "Signed-in users can update leads" on public.leads;
drop policy if exists "Inbox can read leads" on public.leads;
drop policy if exists "Inbox can update leads" on public.leads;

grant select, update on table public.leads to anon, authenticated;

create policy "Inbox can read leads"
on public.leads
for select
to anon, authenticated
using (true);

create policy "Inbox can update leads"
on public.leads
for update
to anon, authenticated
using (true)
with check (true);

create or replace function public.admin_list_leads(p_password text)
returns setof public.leads
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_password is distinct from '0505' then
    raise exception 'Unauthorized';
  end if;
  return query select * from public.leads order by created_at desc;
end;
$$;

create or replace function public.admin_update_lead(
  p_password text,
  p_id uuid,
  p_status text default null,
  p_notes text default null
)
returns public.leads
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.leads;
begin
  if p_password is distinct from '0505' then
    raise exception 'Unauthorized';
  end if;
  update public.leads
  set
    status = coalesce(nullif(p_status, ''), status),
    notes = case when p_notes is null then notes else p_notes end
  where id = p_id
  returning * into row;
  if row.id is null then
    raise exception 'Lead not found';
  end if;
  return row;
end;
$$;

grant execute on function public.admin_list_leads(text) to anon, authenticated;
grant execute on function public.admin_update_lead(text, uuid, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

alter table public.leads replica identity full;
alter table public.leads add column if not exists service text;

do $$
begin
  alter publication supabase_realtime add table public.leads;
exception
  when duplicate_object then null;
end $$;
