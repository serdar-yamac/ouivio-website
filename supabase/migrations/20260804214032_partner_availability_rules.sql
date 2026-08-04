-- Providers define the time in which they want to accept direct bookings.
-- External calendars remain an additional blocking signal; they never make a
-- time bookable on their own.
create table public.partner_availability_rules (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  -- "all" is the provider-wide default. A later resource-specific row can
  -- override it for a room, team or individual photographer.
  resource_key text not null default 'all' check (resource_key ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  allowed_weekdays smallint[] not null default array[1,2,3,4,5,6,7]::smallint[]
    check (cardinality(allowed_weekdays) > 0 and allowed_weekdays <@ array[1,2,3,4,5,6,7]::smallint[]),
  daily_starts_at time not null default time '08:00',
  daily_ends_at time not null default time '22:00',
  min_notice_hours integer not null default 24 check (min_notice_hours between 0 and 8760),
  max_advance_days integer not null default 730 check (max_advance_days between 1 and 1825),
  block_german_public_holidays boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (daily_ends_at > daily_starts_at)
);

create unique index partner_availability_rules_scope_idx
  on public.partner_availability_rules(partner_id, resource_key);
create index partner_availability_rules_partner_idx
  on public.partner_availability_rules(partner_id);

create table public.partner_availability_blackouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  resource_key text not null default 'all' check (resource_key ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  label text not null check (char_length(label) between 1 and 120),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index partner_availability_blackouts_range_idx
  on public.partner_availability_blackouts(partner_id, starts_on, ends_on);

alter table public.partner_availability_rules enable row level security;
alter table public.partner_availability_blackouts enable row level security;

create policy "partners manage own availability rules"
on public.partner_availability_rules for all to authenticated
using (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

create policy "partners manage own availability blackouts"
on public.partner_availability_blackouts for all to authenticated
using (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

revoke all on public.partner_availability_rules, public.partner_availability_blackouts from anon;
grant select, insert, update, delete on public.partner_availability_rules, public.partner_availability_blackouts to authenticated;

create or replace function private.easter_sunday(p_year integer)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  a integer; b integer; c integer; d integer; e integer; f integer; g integer;
  h integer; i integer; k integer; l integer; m integer; month_value integer; day_value integer;
begin
  a := p_year % 19; b := p_year / 100; c := p_year % 100; d := b / 4; e := b % 4;
  f := (b + 8) / 25; g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30; i := c / 4; k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7; m := (a + 11 * h + 22 * l) / 451;
  month_value := (h + l - 7 * m + 114) / 31;
  day_value := ((h + l - 7 * m + 114) % 31) + 1;
  return make_date(p_year, month_value, day_value);
end;
$$;

create or replace function private.is_german_public_holiday(p_date date)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  easter date := private.easter_sunday(extract(year from p_date)::integer);
begin
  -- Nationwide German public holidays. Regional holidays remain controllable
  -- through the provider's own blackout ranges.
  return p_date in (
    make_date(extract(year from p_date)::integer, 1, 1),
    easter - 2,
    easter + 1,
    make_date(extract(year from p_date)::integer, 5, 1),
    easter + 39,
    easter + 50,
    make_date(extract(year from p_date)::integer, 10, 3),
    make_date(extract(year from p_date)::integer, 12, 25),
    make_date(extract(year from p_date)::integer, 12, 26)
  );
end;
$$;

create or replace function private.partner_slot_is_bookable(
  p_partner_id uuid,
  p_resource_key text,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  rule public.partner_availability_rules%rowtype;
  timezone_name text;
  local_start timestamp;
  local_end timestamp;
  today_local date;
begin
  select profile.timezone into timezone_name
  from public.partner_profiles profile where profile.id = p_partner_id;
  if timezone_name is null then return false; end if;

  select * into rule
  from public.partner_availability_rules candidate
  where candidate.partner_id = p_partner_id
    and (candidate.resource_key = p_resource_key or candidate.resource_key = 'all')
  order by case when candidate.resource_key = p_resource_key then 0 else 1 end
  limit 1;

  -- No self-managed rule means the existing calendar-based availability keeps
  -- working exactly as before until the provider explicitly configures it.
  if not found then return true; end if;

  local_start := p_starts_at at time zone timezone_name;
  local_end := (p_ends_at - interval '1 second') at time zone timezone_name;
  today_local := now() at time zone timezone_name;

  if local_end::date <> local_start::date
    or extract(isodow from local_start)::smallint <> all(rule.allowed_weekdays)
    or local_start::time < rule.daily_starts_at
    or local_end::time > rule.daily_ends_at
    or p_starts_at < now() + make_interval(hours => rule.min_notice_hours)
    or local_start::date > today_local + rule.max_advance_days
    or (rule.block_german_public_holidays and private.is_german_public_holiday(local_start::date))
  then return false; end if;

  return not exists (
    select 1 from public.partner_availability_blackouts blackout
    where blackout.partner_id = p_partner_id
      and (blackout.resource_key = p_resource_key or blackout.resource_key = 'all')
      and daterange(blackout.starts_on, blackout.ends_on, '[]') @> local_start::date
  );
end;
$$;

-- Availability rules are enforced both in the authenticated availability check
-- and in the booking trigger. The latter is the authoritative protection.
create or replace function public.check_partner_availability(
  requested_package_id uuid,
  requested_starts_at timestamptz
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  selected_package public.partner_packages%rowtype;
  requested_end timestamptz;
  reserved_start timestamptz;
  reserved_end timestamptz;
begin
  if (select auth.uid()) is null or requested_starts_at < now() then return false; end if;
  select * into selected_package from public.partner_packages where id = requested_package_id and is_published;
  if not found then return false; end if;
  requested_end := requested_starts_at + pg_catalog.make_interval(mins => selected_package.duration_minutes);
  reserved_start := requested_starts_at - pg_catalog.make_interval(mins => selected_package.buffer_before_minutes);
  reserved_end := requested_end + pg_catalog.make_interval(mins => selected_package.buffer_after_minutes);
  if not private.partner_slot_is_bookable(selected_package.partner_id, selected_package.resource_key, requested_starts_at, requested_end) then return false; end if;
  return not exists (
    select 1 from public.partner_calendar_events event where event.partner_id = selected_package.partner_id and event.resource_key = selected_package.resource_key and event.status <> 'cancelled' and tstzrange(event.starts_at, event.ends_at, '[)') && tstzrange(reserved_start, reserved_end, '[)')
  ) and not exists (
    select 1 from public.partner_bookings booking where booking.partner_id = selected_package.partner_id and booking.resource_key = selected_package.resource_key and booking.status in ('pending_payment', 'confirmed') and tstzrange(booking.reserved_starts_at, booking.reserved_ends_at, '[)') && tstzrange(reserved_start, reserved_end, '[)')
  );
end;
$$;

create or replace function public.search_published_partner_packages(
  requested_service_types text[] default null,
  requested_city text default null,
  requested_starts_at timestamptz default null
)
returns table (
  package_id uuid, partner_id uuid, partner_name text, city text, service_type text,
  package_name text, description text, price_amount numeric, currency text,
  duration_minutes integer, included_items text[], booking_mode text,
  external_addons_policy text, external_addons_note text
)
language sql
stable
security definer
set search_path = ''
as $$
  select package.id, profile.id, profile.business_name, profile.city, package.service_type,
    package.name, package.description, package.price_amount, package.currency,
    package.duration_minutes, package.included_items, service_area.booking_mode,
    service_area.external_addons_policy, service_area.external_addons_note
  from public.partner_packages package
  join public.partner_profiles profile on profile.id = package.partner_id
  join public.partner_service_areas service_area on service_area.partner_id = package.partner_id and service_area.service_type = package.service_type
  where package.is_published and service_area.is_active
    and (requested_service_types is null or package.service_type = any(requested_service_types))
    and (requested_city is null or requested_city = '' or profile.city ilike '%' || requested_city || '%')
    and (requested_starts_at is null or (
      private.partner_slot_is_bookable(package.partner_id, package.resource_key, requested_starts_at, requested_starts_at + pg_catalog.make_interval(mins => package.duration_minutes))
      and not exists (select 1 from public.partner_calendar_events event where event.partner_id = package.partner_id and event.resource_key = package.resource_key and event.status <> 'cancelled' and tstzrange(event.starts_at, event.ends_at, '[)') && tstzrange(requested_starts_at - pg_catalog.make_interval(mins => package.buffer_before_minutes), requested_starts_at + pg_catalog.make_interval(mins => package.duration_minutes + package.buffer_after_minutes), '[)'))
      and not exists (select 1 from public.partner_bookings booking where booking.partner_id = package.partner_id and booking.resource_key = package.resource_key and booking.status in ('pending_payment', 'confirmed') and tstzrange(booking.reserved_starts_at, booking.reserved_ends_at, '[)') && tstzrange(requested_starts_at - pg_catalog.make_interval(mins => package.buffer_before_minutes), requested_starts_at + pg_catalog.make_interval(mins => package.duration_minutes + package.buffer_after_minutes), '[)'))
    ))
  order by package.service_type, package.price_amount, package.created_at;
$$;

-- The booking trigger recalculates partner/package values, then applies the
-- exact same managed availability gate before a reservation can be created.
create or replace function private.prepare_direct_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_package public.partner_packages%rowtype;
begin
  if (select auth.uid()) is null or not private.is_wedding_member(new.wedding_id) then raise exception 'BOOKING_NOT_AUTHORIZED' using errcode = '42501'; end if;
  select * into selected_package from public.partner_packages where id = new.package_id and is_published for share;
  if not found then raise exception 'PACKAGE_NOT_AVAILABLE' using errcode = 'P0001'; end if;
  if new.starts_at < now() then raise exception 'BOOKING_DATE_IN_PAST' using errcode = '22007'; end if;
  new.partner_id := selected_package.partner_id;
  new.resource_key := selected_package.resource_key;
  new.created_by := (select auth.uid());
  new.ends_at := new.starts_at + pg_catalog.make_interval(mins => selected_package.duration_minutes);
  new.reserved_starts_at := new.starts_at - pg_catalog.make_interval(mins => selected_package.buffer_before_minutes);
  new.reserved_ends_at := new.ends_at + pg_catalog.make_interval(mins => selected_package.buffer_after_minutes);
  new.price_amount := selected_package.price_amount;
  new.currency := selected_package.currency;
  new.status := 'pending_payment'; new.hold_expires_at := now() + interval '15 minutes'; new.confirmed_at := null; new.cancelled_at := null;
  if not private.partner_slot_is_bookable(new.partner_id, new.resource_key, new.starts_at, new.ends_at) then raise exception 'BOOKING_SLOT_UNAVAILABLE' using errcode = '23P01'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.partner_id::text || ':' || new.resource_key, 0));
  if exists (select 1 from public.partner_calendar_events event where event.partner_id = new.partner_id and event.resource_key = new.resource_key and event.status <> 'cancelled' and tstzrange(event.starts_at, event.ends_at, '[)') && tstzrange(new.reserved_starts_at, new.reserved_ends_at, '[)')) then raise exception 'BOOKING_SLOT_UNAVAILABLE' using errcode = '23P01'; end if;
  return new;
end;
$$;

revoke all on function private.easter_sunday(integer), private.is_german_public_holiday(date), private.partner_slot_is_bookable(uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.check_partner_availability(uuid, timestamptz), public.search_published_partner_packages(text[], text, timestamptz) from public, anon;
grant execute on function public.check_partner_availability(uuid, timestamptz) to authenticated;
grant execute on function public.search_published_partner_packages(text[], text, timestamptz) to anon, authenticated;
