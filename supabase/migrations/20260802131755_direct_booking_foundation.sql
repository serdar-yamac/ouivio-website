create extension if not exists btree_gist with schema extensions;

alter table public.partner_calendar_events
  add column resource_key text not null default 'primary'
  check (resource_key ~ '^[a-z0-9][a-z0-9_-]{0,63}$');

create table public.partner_packages (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  resource_key text not null default 'primary'
    check (resource_key ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  duration_minutes integer not null check (duration_minutes between 30 and 2880),
  buffer_before_minutes integer not null default 0
    check (buffer_before_minutes between 0 and 1440),
  buffer_after_minutes integer not null default 0
    check (buffer_after_minutes between 0 and 1440),
  price_amount numeric(12,2) not null check (price_amount >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  included_items text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, partner_id, resource_key)
);

create table public.partner_bookings (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  partner_id uuid not null references public.partner_profiles(id) on delete restrict,
  package_id uuid not null,
  resource_key text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reserved_starts_at timestamptz not null,
  reserved_ends_at timestamptz not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'expired', 'refunded')),
  price_amount numeric(12,2) not null check (price_amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  calendar_event_id uuid unique references public.partner_calendar_events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (reserved_ends_at > reserved_starts_at),
  constraint partner_bookings_package_resource_fk
    foreign key (package_id, partner_id, resource_key)
    references public.partner_packages(id, partner_id, resource_key)
    on delete restrict
);

alter table public.partner_bookings
  add constraint partner_bookings_no_active_overlap
  exclude using gist (
    partner_id with =,
    resource_key with =,
    tstzrange(reserved_starts_at, reserved_ends_at, '[)') with &&
  ) where (status in ('pending_payment', 'confirmed'));

create index partner_packages_partner_published_idx
  on public.partner_packages(partner_id, is_published, created_at);
create index partner_bookings_wedding_created_idx
  on public.partner_bookings(wedding_id, created_at desc);
create index partner_bookings_partner_starts_idx
  on public.partner_bookings(partner_id, starts_at);
create index partner_calendar_events_resource_window_idx
  on public.partner_calendar_events(partner_id, resource_key, starts_at, ends_at)
  where status <> 'cancelled';

create or replace function private.lock_partner_resource()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.partner_id::text || ':' || new.resource_key, 0)
  );
  return new;
end;
$$;

create trigger lock_partner_calendar_resource
before insert or update of partner_id, resource_key, starts_at, ends_at, status
on public.partner_calendar_events
for each row execute function private.lock_partner_resource();

create or replace function private.prepare_direct_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_package public.partner_packages%rowtype;
begin
  if (select auth.uid()) is null or not private.is_wedding_member(new.wedding_id) then
    raise exception 'BOOKING_NOT_AUTHORIZED' using errcode = '42501';
  end if;

  select * into selected_package
  from public.partner_packages
  where id = new.package_id and is_published
  for share;

  if not found then
    raise exception 'PACKAGE_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  if new.starts_at < now() then
    raise exception 'BOOKING_DATE_IN_PAST' using errcode = '22007';
  end if;

  new.partner_id := selected_package.partner_id;
  new.resource_key := selected_package.resource_key;
  new.created_by := (select auth.uid());
  new.ends_at := new.starts_at + pg_catalog.make_interval(mins => selected_package.duration_minutes);
  new.reserved_starts_at := new.starts_at - pg_catalog.make_interval(mins => selected_package.buffer_before_minutes);
  new.reserved_ends_at := new.ends_at + pg_catalog.make_interval(mins => selected_package.buffer_after_minutes);
  new.price_amount := selected_package.price_amount;
  new.currency := selected_package.currency;
  new.status := 'pending_payment';
  new.hold_expires_at := now() + interval '15 minutes';
  new.confirmed_at := null;
  new.cancelled_at := null;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.partner_id::text || ':' || new.resource_key, 0)
  );

  if exists (
    select 1 from public.partner_calendar_events event
    where event.partner_id = new.partner_id
      and event.resource_key = new.resource_key
      and event.status <> 'cancelled'
      and tstzrange(event.starts_at, event.ends_at, '[)') &&
          tstzrange(new.reserved_starts_at, new.reserved_ends_at, '[)')
  ) then
    raise exception 'BOOKING_SLOT_UNAVAILABLE' using errcode = '23P01';
  end if;

  return new;
end;
$$;

create trigger prepare_direct_booking
before insert on public.partner_bookings
for each row execute function private.prepare_direct_booking();

create or replace function private.sync_booking_calendar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
  package_name text;
begin
  if tg_op = 'INSERT' then
    select name into package_name from public.partner_packages where id = new.package_id;
    insert into public.partner_calendar_events (
      partner_id, resource_key, title, starts_at, ends_at,
      notes, event_type, status, source
    ) values (
      new.partner_id, new.resource_key, 'Ouivio-Buchung · ' || package_name,
      new.reserved_starts_at, new.reserved_ends_at,
      'Zahlungsfenster bis ' || new.hold_expires_at::text,
      'option', 'tentative', 'ouivio'
    ) returning id into event_id;

    update public.partner_bookings set calendar_event_id = event_id where id = new.id;
    return new;
  end if;

  update public.partner_calendar_events
  set event_type = case when new.status = 'confirmed' then 'booking' else event_type end,
      status = case
        when new.status = 'confirmed' then 'confirmed'
        when new.status in ('cancelled', 'expired', 'refunded') then 'cancelled'
        else 'tentative'
      end,
      updated_at = now()
  where id = new.calendar_event_id;
  return new;
end;
$$;

create trigger sync_booking_calendar_after_insert
after insert on public.partner_bookings
for each row execute function private.sync_booking_calendar();

create trigger sync_booking_calendar_after_status
after update of status on public.partner_bookings
for each row when (old.status is distinct from new.status)
execute function private.sync_booking_calendar();

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
  if (select auth.uid()) is null or requested_starts_at < now() then
    return false;
  end if;

  select * into selected_package
  from public.partner_packages
  where id = requested_package_id and is_published;

  if not found then return false; end if;

  requested_end := requested_starts_at + pg_catalog.make_interval(mins => selected_package.duration_minutes);
  reserved_start := requested_starts_at - pg_catalog.make_interval(mins => selected_package.buffer_before_minutes);
  reserved_end := requested_end + pg_catalog.make_interval(mins => selected_package.buffer_after_minutes);

  return not exists (
    select 1 from public.partner_calendar_events event
    where event.partner_id = selected_package.partner_id
      and event.resource_key = selected_package.resource_key
      and event.status <> 'cancelled'
      and tstzrange(event.starts_at, event.ends_at, '[)') && tstzrange(reserved_start, reserved_end, '[)')
  ) and not exists (
    select 1 from public.partner_bookings booking
    where booking.partner_id = selected_package.partner_id
      and booking.resource_key = selected_package.resource_key
      and booking.status in ('pending_payment', 'confirmed')
      and tstzrange(booking.reserved_starts_at, booking.reserved_ends_at, '[)') && tstzrange(reserved_start, reserved_end, '[)')
  );
end;
$$;

alter table public.partner_packages enable row level security;
alter table public.partner_bookings enable row level security;

create policy "partners manage own packages"
on public.partner_packages for all to authenticated
using (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

create policy "customers read published packages"
on public.partner_packages for select to authenticated
using (is_published);

create policy "wedding members read own bookings"
on public.partner_bookings for select to authenticated
using (private.is_wedding_member(wedding_id));

create policy "partners read received bookings"
on public.partner_bookings for select to authenticated
using (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

create policy "wedding members start direct bookings"
on public.partner_bookings for insert to authenticated
with check (
  private.is_wedding_member(wedding_id)
  and created_by = (select auth.uid())
  and status = 'pending_payment'
);

revoke all on public.partner_packages, public.partner_bookings from anon;
grant select on public.partner_packages to authenticated;
grant select, insert on public.partner_bookings to authenticated;

revoke all on function private.lock_partner_resource() from public, anon, authenticated;
revoke all on function private.prepare_direct_booking() from public, anon, authenticated;
revoke all on function private.sync_booking_calendar() from public, anon, authenticated;
revoke all on function public.check_partner_availability(uuid, timestamptz) from public, anon;
grant execute on function public.check_partner_availability(uuid, timestamptz) to authenticated;
