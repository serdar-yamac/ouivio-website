alter table public.calendar_connections drop column if exists encrypted_credentials;
create table if not exists private.calendar_connection_secrets (
  connection_id uuid primary key references public.calendar_connections(id) on delete cascade,
  encrypted_credentials text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.calendar_connection_secrets from public, anon, authenticated;
