-- Test-only booking lifecycle for the @ouivio.invalid development providers.
-- It deliberately cannot confirm a booking for a real provider.

create or replace function private.expire_pending_partner_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_count integer;
begin
  update public.partner_bookings
  set status = 'expired', updated_at = pg_catalog.now()
  where status = 'pending_payment'
    and hold_expires_at is not null
    and hold_expires_at <= pg_catalog.now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

create extension if not exists pg_cron;

select cron.unschedule(jobid)
from cron.job
where jobname = 'ouivio-expire-pending-bookings';

select cron.schedule(
  'ouivio-expire-pending-bookings',
  '* * * * *',
  $$select private.expire_pending_partner_bookings()$$
);

create or replace function public.start_test_partner_bookings(
  requested_wedding_id uuid,
  requested_package_ids uuid[],
  requested_starts_at timestamptz
)
returns table (booking_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  package_id uuid;
  created_booking_id uuid;
begin
  if (select auth.uid()) is null
    or not private.is_wedding_member(requested_wedding_id) then
    raise exception 'BOOKING_NOT_AUTHORIZED' using errcode = '42501';
  end if;

  if requested_starts_at < pg_catalog.now()
    or requested_package_ids is null
    or cardinality(requested_package_ids) = 0
    or cardinality(requested_package_ids) <> cardinality(array(select distinct value from unnest(requested_package_ids) as value)) then
    raise exception 'INVALID_TEST_BOOKING_REQUEST' using errcode = '22023';
  end if;

  foreach package_id in array requested_package_ids loop
    if not exists (
      select 1
      from public.partner_packages package
      join public.partner_profiles partner on partner.id = package.partner_id
      join auth.users owner on owner.id = partner.owner_id
      where package.id = package_id
        and package.is_published
        and owner.email like '%@ouivio.invalid'
    ) then
      raise exception 'TEST_PACKAGE_NOT_AVAILABLE' using errcode = '42501';
    end if;

    insert into public.partner_bookings (wedding_id, package_id, starts_at)
    values (requested_wedding_id, package_id, requested_starts_at)
    returning id into created_booking_id;

    booking_id := created_booking_id;
    return next;
  end loop;
end;
$$;

create or replace function public.confirm_test_partner_bookings(
  requested_booking_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmed_count integer;
begin
  if (select auth.uid()) is null
    or requested_booking_ids is null
    or cardinality(requested_booking_ids) = 0
    or cardinality(requested_booking_ids) <> cardinality(array(select distinct value from unnest(requested_booking_ids) as value)) then
    raise exception 'INVALID_TEST_BOOKING_REQUEST' using errcode = '22023';
  end if;

  update public.partner_bookings booking
  set status = 'confirmed', confirmed_at = pg_catalog.now(), hold_expires_at = null, updated_at = pg_catalog.now()
  from public.partner_profiles partner
  join auth.users owner on owner.id = partner.owner_id
  where booking.id = any(requested_booking_ids)
    and booking.created_by = (select auth.uid())
    and booking.partner_id = partner.id
    and owner.email like '%@ouivio.invalid'
    and booking.status = 'pending_payment'
    and booking.hold_expires_at > pg_catalog.now();

  get diagnostics confirmed_count = row_count;
  if confirmed_count <> cardinality(requested_booking_ids) then
    raise exception 'TEST_BOOKING_CANNOT_BE_CONFIRMED' using errcode = 'P0001';
  end if;
  return confirmed_count;
end;
$$;

revoke all on function private.expire_pending_partner_bookings() from public, anon, authenticated;
revoke all on function public.start_test_partner_bookings(uuid, uuid[], timestamptz) from public, anon;
revoke all on function public.confirm_test_partner_bookings(uuid[]) from public, anon;
grant execute on function public.start_test_partner_bookings(uuid, uuid[], timestamptz) to authenticated;
grant execute on function public.confirm_test_partner_bookings(uuid[]) to authenticated;
