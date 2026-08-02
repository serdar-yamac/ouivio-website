create index partner_bookings_created_by_idx
  on public.partner_bookings(created_by);
create index partner_bookings_package_resource_idx
  on public.partner_bookings(package_id, partner_id, resource_key);

drop policy "partners manage own packages" on public.partner_packages;
drop policy "customers read published packages" on public.partner_packages;

create policy "users read available or owned packages"
on public.partner_packages for select to authenticated
using (
  is_published or exists (
    select 1 from public.partner_profiles profile
    where profile.id = partner_id and profile.owner_id = (select auth.uid())
  )
);

create policy "partners create own packages"
on public.partner_packages for insert to authenticated
with check (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

create policy "partners update own packages"
on public.partner_packages for update to authenticated
using (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

create policy "partners delete own packages"
on public.partner_packages for delete to authenticated
using (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

drop policy "wedding members read own bookings" on public.partner_bookings;
drop policy "partners read received bookings" on public.partner_bookings;

create policy "participants read relevant bookings"
on public.partner_bookings for select to authenticated
using (
  private.is_wedding_member(wedding_id) or exists (
    select 1 from public.partner_profiles profile
    where profile.id = partner_id and profile.owner_id = (select auth.uid())
  )
);
