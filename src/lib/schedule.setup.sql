-- Pluss.dev dashboard: weekly availability, BDR assignment, meetings.
-- Run this in the Supabase SQL editor.
-- Passwords: Owner 0505 | BDR 1 1515 | BDR 2 2525
-- Times are stored in timestamptz and interpreted in Africa/Algiers.

alter table public.leads
  add column if not exists assigned_to text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_assigned_to_check'
  ) then
    alter table public.leads
      add constraint leads_assigned_to_check
      check (assigned_to is null or assigned_to in ('bdr1', 'bdr2'));
  end if;
end $$;

create index if not exists leads_assigned_to_idx on public.leads (assigned_to);

create table if not exists public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 1 and 7),
  start_minute smallint not null check (start_minute >= 0 and start_minute < 1440),
  end_minute smallint not null check (end_minute > start_minute and end_minute <= 1440)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  bdr_id text not null check (bdr_id in ('bdr1', 'bdr2')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint meetings_order check (ends_at > starts_at)
);

create index if not exists meetings_starts_at_idx on public.meetings (starts_at);
create index if not exists meetings_lead_id_idx on public.meetings (lead_id);

alter table public.availability_windows enable row level security;
alter table public.meetings enable row level security;

create or replace function public.dashboard_role(p_password text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_password is not distinct from '0505' then
    return 'admin';
  end if;
  if p_password is not distinct from '1515' then
    return 'bdr1';
  end if;
  if p_password is not distinct from '2525' then
    return 'bdr2';
  end if;
  raise exception 'Unauthorized';
end;
$$;

create or replace function public.dashboard_list_leads(p_password text)
returns setof public.leads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := public.dashboard_role(p_password);
  if v_role = 'admin' then
    return query select * from public.leads order by created_at desc;
  else
    return query
      select * from public.leads
      where assigned_to = v_role
      order by created_at desc;
  end if;
end;
$$;

create or replace function public.dashboard_update_lead(
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
  v_role text;
  row public.leads;
begin
  v_role := public.dashboard_role(p_password);
  update public.leads
  set
    status = coalesce(nullif(p_status, ''), status),
    notes = case when p_notes is null then notes else p_notes end
  where id = p_id
    and (v_role = 'admin' or assigned_to = v_role)
  returning * into row;
  if row.id is null then
    raise exception 'Lead not found';
  end if;
  return row;
end;
$$;

create or replace function public.dashboard_assign_lead(
  p_password text,
  p_id uuid,
  p_assigned_to text
)
returns public.leads
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.leads;
begin
  if public.dashboard_role(p_password) is distinct from 'admin' then
    raise exception 'Only the owner can assign leads';
  end if;
  if p_assigned_to is not null and p_assigned_to not in ('', 'bdr1', 'bdr2') then
    raise exception 'Invalid BDR';
  end if;
  update public.leads
  set assigned_to = nullif(p_assigned_to, '')
  where id = p_id
  returning * into row;
  if row.id is null then
    raise exception 'Lead not found';
  end if;
  return row;
end;
$$;

create or replace function public.dashboard_delete_lead(
  p_password text,
  p_id uuid,
  p_confirm text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.leads;
begin
  if public.dashboard_role(p_password) is distinct from 'admin' then
    raise exception 'Only the owner can delete leads';
  end if;
  select * into row from public.leads where id = p_id;
  if row.id is null then
    raise exception 'Lead not found';
  end if;
  if btrim(coalesce(p_confirm, '')) is distinct from ('DELETE ' || row.full_name) then
    raise exception 'Rewrite the confirmation phrase exactly';
  end if;
  delete from public.leads where id = p_id;
end;
$$;

create or replace function public.dashboard_list_availability(p_password text)
returns setof public.availability_windows
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.dashboard_role(p_password);
  return query
    select * from public.availability_windows
    order by weekday, start_minute;
end;
$$;

create or replace function public.dashboard_set_availability(
  p_password text,
  p_windows jsonb
)
returns setof public.availability_windows
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.dashboard_role(p_password) is distinct from 'admin' then
    raise exception 'Only the owner can edit availability';
  end if;
  if p_windows is null or jsonb_typeof(p_windows) is distinct from 'array' then
    raise exception 'Availability must be an array';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_windows) as x(weekday int, start_minute int, end_minute int)
    where x.weekday not between 1 and 7
       or x.start_minute < 0
       or x.end_minute > 1440
       or x.end_minute <= x.start_minute
  ) then
    raise exception 'Invalid availability window';
  end if;

  delete from public.availability_windows where id is not null;

  insert into public.availability_windows (weekday, start_minute, end_minute)
  select x.weekday, x.start_minute, x.end_minute
  from jsonb_to_recordset(p_windows) as x(weekday int, start_minute int, end_minute int);

  return query
    select * from public.availability_windows
    order by weekday, start_minute;
end;
$$;

create or replace function public.dashboard_set_availability_slots(
  p_password text,
  p_weekdays int[],
  p_starts int[],
  p_ends int[]
)
returns setof public.availability_windows
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.dashboard_role(p_password) is distinct from 'admin' then
    raise exception 'Only the owner can edit availability';
  end if;
  if coalesce(cardinality(p_weekdays), 0) <> coalesce(cardinality(p_starts), 0)
     or coalesce(cardinality(p_weekdays), 0) <> coalesce(cardinality(p_ends), 0) then
    raise exception 'Availability slots are mismatched';
  end if;
  if exists (
    select 1
    from generate_subscripts(coalesce(p_weekdays, '{}'::int[]), 1) as i
    where p_weekdays[i] not between 1 and 7
       or p_starts[i] < 0
       or p_ends[i] > 1440
       or p_ends[i] <= p_starts[i]
  ) then
    raise exception 'Invalid availability window';
  end if;

  delete from public.availability_windows where id is not null;

  if p_weekdays is not null and cardinality(p_weekdays) > 0 then
    insert into public.availability_windows (weekday, start_minute, end_minute)
    select p_weekdays[i], p_starts[i], p_ends[i]
    from generate_subscripts(p_weekdays, 1) as i;
  end if;

  return query
    select * from public.availability_windows
    order by weekday, start_minute;
end;
$$;

create or replace function public.dashboard_list_meetings(
  p_password text,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  id uuid,
  lead_id uuid,
  lead_name text,
  bdr_id text,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.dashboard_role(p_password);
  return query
    select
      m.id,
      m.lead_id,
      l.full_name,
      m.bdr_id,
      m.starts_at,
      m.ends_at,
      m.notes,
      m.created_at
    from public.meetings m
    left join public.leads l on l.id = m.lead_id
    where m.starts_at < p_to
      and m.ends_at > p_from
    order by m.starts_at;
end;
$$;

create or replace function public.dashboard_book_meeting(
  p_password text,
  p_lead_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_notes text default null
)
returns public.meetings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_lead public.leads;
  v_wd int;
  v_start_min int;
  v_end_min int;
  row public.meetings;
begin
  v_role := public.dashboard_role(p_password);
  if v_role not in ('bdr1', 'bdr2') then
    raise exception 'Only BDRs can book meetings';
  end if;
  if p_ends_at <= p_starts_at then
    raise exception 'Invalid meeting time';
  end if;
  if p_starts_at < now() - interval '30 seconds' then
    raise exception 'Cannot book in the past';
  end if;
  if p_ends_at - p_starts_at < interval '15 minutes'
     or p_ends_at - p_starts_at > interval '3 hours' then
    raise exception 'Meeting must be between 15 minutes and 3 hours';
  end if;
  if (p_starts_at at time zone 'Africa/Algiers')::date
     is distinct from (p_ends_at at time zone 'Africa/Algiers')::date then
    raise exception 'Meetings must stay on the same day';
  end if;

  select * into v_lead from public.leads where id = p_lead_id;
  if v_lead.id is null then
    raise exception 'Lead not found';
  end if;
  if v_lead.assigned_to is distinct from v_role then
    raise exception 'This lead is not assigned to you';
  end if;

  v_wd := extract(isodow from (p_starts_at at time zone 'Africa/Algiers'))::int;
  v_start_min := (
    extract(hour from (p_starts_at at time zone 'Africa/Algiers')) * 60
    + extract(minute from (p_starts_at at time zone 'Africa/Algiers'))
  )::int;
  v_end_min := (
    extract(hour from (p_ends_at at time zone 'Africa/Algiers')) * 60
    + extract(minute from (p_ends_at at time zone 'Africa/Algiers'))
  )::int;

  if not exists (
    select 1
    from public.availability_windows w
    where w.weekday = v_wd
      and w.start_minute <= v_start_min
      and w.end_minute >= v_end_min
  ) then
    raise exception 'That time is outside the meeting zone';
  end if;

  if exists (
    select 1
    from public.meetings m
    where m.starts_at < p_ends_at
      and m.ends_at > p_starts_at
  ) then
    raise exception 'That slot overlaps another BDR meeting';
  end if;

  insert into public.meetings (lead_id, bdr_id, starts_at, ends_at, notes)
  values (p_lead_id, v_role, p_starts_at, p_ends_at, nullif(btrim(coalesce(p_notes, '')), ''))
  returning * into row;

  update public.leads
  set status = 'booked'
  where id = p_lead_id
    and status in ('new', 'contacted');

  return row;
end;
$$;

create or replace function public.dashboard_cancel_meeting(
  p_password text,
  p_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  deleted int;
begin
  v_role := public.dashboard_role(p_password);
  delete from public.meetings
  where id = p_id
    and (v_role = 'admin' or bdr_id = v_role);
  get diagnostics deleted = row_count;
  if deleted = 0 then
    raise exception 'Meeting not found';
  end if;
end;
$$;

grant execute on function public.dashboard_role(text) to anon, authenticated;
grant execute on function public.dashboard_list_leads(text) to anon, authenticated;
grant execute on function public.dashboard_update_lead(text, uuid, text, text) to anon, authenticated;
grant execute on function public.dashboard_assign_lead(text, uuid, text) to anon, authenticated;
grant execute on function public.dashboard_delete_lead(text, uuid, text) to anon, authenticated;
grant execute on function public.dashboard_list_availability(text) to anon, authenticated;
grant execute on function public.dashboard_set_availability(text, jsonb) to anon, authenticated;
grant execute on function public.dashboard_set_availability_slots(text, int[], int[], int[]) to anon, authenticated;
grant execute on function public.dashboard_list_meetings(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.dashboard_book_meeting(text, uuid, timestamptz, timestamptz, text) to anon, authenticated;
grant execute on function public.dashboard_cancel_meeting(text, uuid) to anon, authenticated;

insert into public.availability_windows (weekday, start_minute, end_minute)
select v.weekday, v.start_minute, v.end_minute
from (values
  (1, 540, 1020),
  (2, 540, 1020),
  (3, 540, 1020),
  (4, 540, 1020),
  (5, 540, 1020)
) as v(weekday, start_minute, end_minute)
where not exists (select 1 from public.availability_windows);

notify pgrst, 'reload schema';
