-- Customer-owned favorites and cart entries need provider details without granting
-- customers broad read access to private partner profile tables.
create or replace function public.get_customer_saved_package_details(
  requested_wedding_id uuid
)
returns table (
  entry_type text,
  package_id uuid,
  created_at timestamptz,
  starts_on date,
  ends_on date,
  partner_name text,
  city text,
  package_name text,
  description text,
  service_type text,
  price_amount numeric,
  currency text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not private.is_wedding_member(requested_wedding_id) then
    raise exception 'not authorized';
  end if;

  return query
  select
    'favorite'::text,
    favorite.package_id,
    favorite.created_at,
    null::date,
    null::date,
    profile.business_name,
    profile.city,
    package.name,
    package.description,
    package.service_type,
    package.price_amount,
    package.currency
  from public.partner_package_favorites favorite
  join public.partner_packages package on package.id = favorite.package_id
  join public.partner_profiles profile on profile.id = package.partner_id
  where favorite.wedding_id = requested_wedding_id

  union all

  select
    'cart'::text,
    cart.package_id,
    cart.created_at,
    cart.starts_on,
    cart.ends_on,
    profile.business_name,
    profile.city,
    package.name,
    package.description,
    package.service_type,
    package.price_amount,
    package.currency
  from public.wedding_cart_items cart
  join public.partner_packages package on package.id = cart.package_id
  join public.partner_profiles profile on profile.id = package.partner_id
  where cart.wedding_id = requested_wedding_id
  order by created_at desc;
end;
$$;

revoke all on function public.get_customer_saved_package_details(uuid) from public, anon, authenticated;
grant execute on function public.get_customer_saved_package_details(uuid) to authenticated;
