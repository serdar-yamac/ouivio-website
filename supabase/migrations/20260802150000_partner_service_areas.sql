create table public.partner_service_areas (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  service_type text not null check (service_type in ('location', 'catering', 'photography')),
  is_active boolean not null default true,
  booking_mode text not null default 'standalone'
    check (booking_mode in ('standalone', 'add_on', 'bundle_only', 'full_package')),
  external_addons_policy text not null default 'allowed'
    check (external_addons_policy in ('allowed', 'restricted', 'not_allowed')),
  external_addons_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, service_type)
);

alter table public.partner_service_areas enable row level security;

create policy "partners manage own service areas"
on public.partner_service_areas for all to authenticated
using (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.partner_profiles profile
  where profile.id = partner_id and profile.owner_id = (select auth.uid())
));

grant select, insert, update, delete on public.partner_service_areas to authenticated;

insert into public.partner_service_areas (partner_id, service_type)
select id, category from public.partner_profiles
where category in ('location', 'catering', 'photography')
on conflict (partner_id, service_type) do nothing;
