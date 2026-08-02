-- Public marketplace catalogue: exposes only partner-controlled, published offer data.
-- Calendar entries, bookings and partner account data remain inaccessible to anonymous users.
create or replace function public.search_published_partner_packages(
  requested_service_types text[] default null,
  requested_city text default null
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
    package.id,
    profile.id,
    profile.business_name,
    profile.city,
    package.service_type,
    package.name,
    package.description,
    package.price_amount,
    package.currency,
    package.duration_minutes,
    package.included_items,
    service_area.booking_mode,
    service_area.external_addons_policy,
    service_area.external_addons_note
  from public.partner_packages package
  join public.partner_profiles profile on profile.id = package.partner_id
  join public.partner_service_areas service_area
    on service_area.partner_id = package.partner_id
    and service_area.service_type = package.service_type
  where package.is_published
    and service_area.is_active
    and (requested_service_types is null or package.service_type = any(requested_service_types))
    and (requested_city is null or requested_city = '' or profile.city ilike '%' || requested_city || '%')
  order by package.service_type, package.price_amount, package.created_at;
$$;

revoke all on function public.search_published_partner_packages(text[], text) from public, anon, authenticated;
grant execute on function public.search_published_partner_packages(text[], text) to anon, authenticated;
