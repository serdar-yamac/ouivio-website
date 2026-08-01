create table public.account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('customer', 'partner')),
  display_name text not null check (char_length(display_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 1 and 160),
  category text,
  city text,
  timezone text not null default 'Europe/Berlin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partner_calendar_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  notes text,
  event_type text not null default 'appointment' check (event_type in ('inquiry', 'option', 'booking', 'appointment', 'blocked')),
  status text not null default 'confirmed' check (status in ('tentative', 'confirmed', 'cancelled')),
  source text not null default 'ouivio' check (source in ('ouivio', 'google', 'microsoft', 'apple', 'ical')),
  external_event_id text,
  external_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft', 'apple', 'ical')),
  external_account_label text,
  external_calendar_id text,
  status text not null default 'pending' check (status in ('pending', 'connected', 'error', 'disconnected')),
  sync_direction text not null default 'two_way' check (sync_direction in ('import', 'export', 'two_way')),
  last_synced_at timestamptz,
  sync_cursor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, provider, external_calendar_id)
);

alter table public.account_profiles enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.partner_calendar_events enable row level security;
alter table public.calendar_connections enable row level security;

create policy "users manage own account profile" on public.account_profiles for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "partners manage own profile" on public.partner_profiles for all to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "partners manage own calendar" on public.partner_calendar_events for all to authenticated
using (exists (select 1 from public.partner_profiles p where p.id = partner_id and p.owner_id = (select auth.uid())))
with check (exists (select 1 from public.partner_profiles p where p.id = partner_id and p.owner_id = (select auth.uid())));
create policy "partners read own connections" on public.calendar_connections for select to authenticated
using (exists (select 1 from public.partner_profiles p where p.id = partner_id and p.owner_id = (select auth.uid())));

grant select, insert, update on public.account_profiles, public.partner_profiles, public.partner_calendar_events to authenticated;
grant delete on public.partner_calendar_events to authenticated;
grant select on public.calendar_connections to authenticated;

create index partner_calendar_events_partner_starts_idx on public.partner_calendar_events(partner_id, starts_at);
create index calendar_connections_partner_idx on public.calendar_connections(partner_id);

create table private.calendar_connection_secrets (
  connection_id uuid primary key references public.calendar_connections(id) on delete cascade,
  encrypted_credentials text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.calendar_connection_secrets from public, anon, authenticated;
