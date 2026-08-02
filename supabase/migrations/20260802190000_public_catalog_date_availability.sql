-- Public marketplace search may hide offers that are unavailable at the selected
-- date, but it never exposes calendar event names, times, or booking details.
drop function if exists public.search_published_partner_packages(text[], text);

create function public.search_published_partner_packages(
  requested_service_types text[] default null,
  requested_city text default null,
  requested_starts_at timestamptz default null
)
returns table (
  package_id uuid,
  partner_id uuid,
  partner_name text,
  city text,
  service_type text,
  package_name text,
  description text,
  price_amount numeric,
  currency text,
  duration_minutes integer,
  included_items text[],
  booking_mode text,
  external_addons_policy text,
  external_addons_note text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    package.id, profile.id, profile.business_name, profile.city,
    package.service_type, package.name, package.description,
    package.price_amount, package.currency, package.duration_minutes,
    package.included_items, service_area.booking_mode,
    service_area.external_addons_policy, service_area.external_addons_note
  from public.partner_packages package
  join public.partner_profiles profile on profile.id = package.partner_id
  join public.partner_service_areas service_area
    on service_area.partner_id = package.partner_id
    and service_area.service_type = package.service_type
  where package.is_published
    and service_area.is_active
    and (requested_service_types is null or package.service_type = any(requested_service_types))
    and (requested_city is null or requested_city = '' or profile.city ilike '%' || requested_city || '%')
    and (
      requested_starts_at is null
      or (
        not exists (
          select 1
          from public.partner_calendar_events event
          where event.partner_id = package.partner_id
            and event.resource_key = package.resource_key
            and event.status <> 'cancelled'
            and tstzrange(event.starts_at, event.ends_at, '[)') && tstzrange(
              requested_starts_at - pg_catalog.make_interval(mins => package.buffer_before_minutes),
              requested_starts_at + pg_catalog.make_interval(mins => package.duration_minutes + package.buffer_after_minutes),
              '[)'
            )
        )
        and not exists (
          select 1
          from public.partner_bookings booking
          where booking.partner_id = package.partner_id
            and booking.resource_key = package.resource_key
            and booking.status in ('pending_payment', 'confirmed')
            and tstzrange(booking.reserved_starts_at, booking.reserved_ends_at, '[)') && tstzrange(
              requested_starts_at - pg_catalog.make_interval(mins => package.buffer_before_minutes),
              requested_starts_at + pg_catalog.make_interval(mins => package.duration_minutes + package.buffer_after_minutes),
              '[)'
            )
        )
      )
    )
  order by package.service_type, package.price_amount, package.created_at;
$$;

revoke all on function public.search_published_partner_packages(text[], text, timestamptz) from public, anon, authenticated;
grant execute on function public.search_published_partner_packages(text[], text, timestamptz) to anon, authenticated;
