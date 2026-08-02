-- Every bookable package belongs to one concrete service area. This allows a
-- multi-service partner to publish, price and make availability decisions per
-- area without changing the existing booking resource safeguards.
alter table public.partner_packages
  add column if not exists service_type text not null default 'photography'
  check (service_type in ('location', 'catering', 'photography'));

create index if not exists partner_packages_partner_service_idx
  on public.partner_packages (partner_id, service_type);

comment on column public.partner_packages.service_type is
  'The customer-facing service area served by this package.';
