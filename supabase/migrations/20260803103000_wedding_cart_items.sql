-- A cart item is a customer's concrete, still non-binding package selection.
-- It intentionally does not create a booking, reservation, or payment hold.

create table public.wedding_cart_items (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  package_id uuid not null references public.partner_packages(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (wedding_id, package_id),
  check (ends_on >= starts_on)
);

create index wedding_cart_items_wedding_created_idx
  on public.wedding_cart_items (wedding_id, created_at desc);

alter table public.wedding_cart_items enable row level security;

create policy "wedding members manage cart items"
on public.wedding_cart_items
for all to authenticated
using (private.is_wedding_member(wedding_id))
with check (private.is_wedding_member(wedding_id));

revoke all on public.wedding_cart_items from anon;
grant select, insert, update, delete on public.wedding_cart_items to authenticated;
