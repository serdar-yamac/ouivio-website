-- A wedding can save published partner packages for a later comparison.
-- Access is constrained to existing wedding members; no anonymous access is granted.

create table public.partner_package_favorites (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  package_id uuid not null references public.partner_packages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wedding_id, package_id)
);

create index partner_package_favorites_wedding_created_idx
  on public.partner_package_favorites (wedding_id, created_at desc);

alter table public.partner_package_favorites enable row level security;

create policy "wedding members manage package favorites"
on public.partner_package_favorites
for all to authenticated
using (private.is_wedding_member(wedding_id))
with check (private.is_wedding_member(wedding_id));

revoke all on public.partner_package_favorites from anon;
grant select, insert, delete on public.partner_package_favorites to authenticated;
