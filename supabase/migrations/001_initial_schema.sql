create extension if not exists "pgcrypto";
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_names text not null,
  wedding_date date,
  location text,
  total_budget numeric(12,2) not null default 0 check (total_budget >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wedding_members (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  notes text,
  due_date date,
  is_done boolean not null default false,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  category text not null,
  title text not null,
  planned_amount numeric(12,2) not null default 0 check (planned_amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'planned' check (status in ('planned', 'reserved', 'paid')),
  created_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  guest_group text,
  email text,
  rsvp_status text not null default 'open' check (rsvp_status in ('open', 'accepted', 'declined')),
  dietary_notes text,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  city text,
  description text,
  starting_price numeric(12,2),
  created_at timestamptz not null default now()
);

create table public.vendor_favorites (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wedding_id, vendor_id)
);

create or replace function private.is_wedding_member(target_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.wedding_members
    where wedding_id = target_wedding_id and user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_wedding_member(uuid) from public;
grant execute on function private.is_wedding_member(uuid) to authenticated;

alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.budget_items enable row level security;
alter table public.guests enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_favorites enable row level security;

create policy "members read weddings" on public.weddings for select to authenticated using (private.is_wedding_member(id) or owner_id = (select auth.uid()));
create policy "owners create weddings" on public.weddings for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owners update weddings" on public.weddings for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "members read memberships" on public.wedding_members for select to authenticated using (private.is_wedding_member(wedding_id));
create policy "owners manage memberships" on public.wedding_members for all to authenticated using (
  exists (select 1 from public.weddings where id = wedding_id and owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.weddings where id = wedding_id and owner_id = (select auth.uid()))
);

create policy "members manage tasks" on public.tasks for all to authenticated using (private.is_wedding_member(wedding_id)) with check (private.is_wedding_member(wedding_id));
create policy "members manage events" on public.events for all to authenticated using (private.is_wedding_member(wedding_id)) with check (private.is_wedding_member(wedding_id));
create policy "members manage budgets" on public.budget_items for all to authenticated using (private.is_wedding_member(wedding_id)) with check (private.is_wedding_member(wedding_id));
create policy "members manage guests" on public.guests for all to authenticated using (private.is_wedding_member(wedding_id)) with check (private.is_wedding_member(wedding_id));
create policy "authenticated users read vendors" on public.vendors for select to authenticated using (true);
create policy "members manage favorites" on public.vendor_favorites for all to authenticated using (private.is_wedding_member(wedding_id)) with check (private.is_wedding_member(wedding_id));

grant select, insert, update, delete on public.weddings, public.wedding_members, public.tasks, public.events, public.budget_items, public.guests, public.vendor_favorites to authenticated;
grant select on public.vendors to authenticated;

create index tasks_wedding_id_idx on public.tasks(wedding_id);
create index events_wedding_id_idx on public.events(wedding_id);
create index budget_items_wedding_id_idx on public.budget_items(wedding_id);
create index guests_wedding_id_idx on public.guests(wedding_id);
