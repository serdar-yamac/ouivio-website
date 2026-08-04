create table private.calendar_oauth_states (
  state_hash text primary key,
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft')),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);
revoke all on private.calendar_oauth_states from public, anon, authenticated;

create or replace function public.create_calendar_oauth_state(p_provider text, p_state_hash text)
returns void language plpgsql security definer set search_path = public, private, auth as $$
declare v_partner_id uuid;
begin
  select id into v_partner_id from public.partner_profiles where owner_id = auth.uid();
  if v_partner_id is null then raise exception 'Partnerkonto erforderlich'; end if;
  if p_provider not in ('google', 'microsoft') or char_length(p_state_hash) <> 64 then raise exception 'Ungültige Kalenderfreigabe'; end if;
  delete from private.calendar_oauth_states where expires_at < now();
  insert into private.calendar_oauth_states (state_hash, partner_id, provider) values (p_state_hash, v_partner_id, p_provider);
end;
$$;
revoke all on function public.create_calendar_oauth_state(text, text) from public, anon;
grant execute on function public.create_calendar_oauth_state(text, text) to authenticated;

create or replace function public.consume_calendar_oauth_state(p_state_hash text)
returns table(partner_id uuid, provider text) language plpgsql security definer set search_path = private as $$
begin
  return query delete from private.calendar_oauth_states
    where state_hash = p_state_hash and expires_at >= now()
    returning calendar_oauth_states.partner_id, calendar_oauth_states.provider;
end;
$$;
revoke all on function public.consume_calendar_oauth_state(text) from public, anon, authenticated;
grant execute on function public.consume_calendar_oauth_state(text) to service_role;

create or replace function public.save_oauth_calendar_connection(
  p_partner_id uuid, p_provider text, p_encrypted_credentials text, p_account_label text
) returns uuid language plpgsql security definer set search_path = public, private as $$
declare v_connection_id uuid;
begin
  if p_provider not in ('google', 'microsoft') then raise exception 'Ungültiger Kalenderanbieter'; end if;
  if char_length(p_encrypted_credentials) < 32 or char_length(p_encrypted_credentials) > 8192 then raise exception 'Ungültige Zugangsdaten'; end if;
  insert into public.calendar_connections (partner_id, provider, external_account_label, external_calendar_id, status, sync_direction, last_synced_at)
  values (p_partner_id, p_provider, left(p_account_label, 254), 'primary', 'connected', 'import', now())
  on conflict (partner_id, provider, external_calendar_id) do update set external_account_label = excluded.external_account_label, status = 'connected', sync_direction = 'import', last_synced_at = now(), updated_at = now()
  returning id into v_connection_id;
  insert into private.calendar_connection_secrets (connection_id, encrypted_credentials, updated_at)
  values (v_connection_id, p_encrypted_credentials, now())
  on conflict (connection_id) do update set encrypted_credentials = excluded.encrypted_credentials, updated_at = now();
  return v_connection_id;
end;
$$;
revoke all on function public.save_oauth_calendar_connection(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.save_oauth_calendar_connection(uuid, text, text, text) to service_role;

create or replace function public.get_oauth_calendar_connection_secret(p_provider text)
returns table(connection_id uuid, partner_id uuid, encrypted_credentials text)
language sql security definer set search_path = public, private, auth as $$
  select connection.id, connection.partner_id, secret.encrypted_credentials
  from public.calendar_connections connection
  join private.calendar_connection_secrets secret on secret.connection_id = connection.id
  join public.partner_profiles partner on partner.id = connection.partner_id
  where partner.owner_id = auth.uid() and connection.provider = p_provider and connection.status = 'connected'
  limit 1
$$;
revoke all on function public.get_oauth_calendar_connection_secret(text) from public, anon;
grant execute on function public.get_oauth_calendar_connection_secret(text) to authenticated;

create or replace function public.replace_calendar_connection_secret(p_connection_id uuid, p_encrypted_credentials text)
returns void language plpgsql security definer set search_path = private as $$
begin
  if char_length(p_encrypted_credentials) < 32 or char_length(p_encrypted_credentials) > 8192 then raise exception 'Ungültige Zugangsdaten'; end if;
  update private.calendar_connection_secrets set encrypted_credentials = p_encrypted_credentials, updated_at = now() where connection_id = p_connection_id;
  if not found then raise exception 'Kalenderverbindung nicht gefunden'; end if;
end;
$$;
revoke all on function public.replace_calendar_connection_secret(uuid, text) from public, anon, authenticated;
grant execute on function public.replace_calendar_connection_secret(uuid, text) to service_role;

create or replace function public.list_calendar_sync_jobs(p_limit integer default 10)
returns table(connection_id uuid, partner_id uuid, provider text, encrypted_credentials text)
language sql security definer set search_path = public, private as $$
  select connection.id, connection.partner_id, connection.provider, secret.encrypted_credentials
  from public.calendar_connections connection
  join private.calendar_connection_secrets secret on secret.connection_id = connection.id
  where connection.provider in ('apple', 'google', 'microsoft') and connection.status = 'connected'
  order by connection.last_synced_at asc nulls first, connection.updated_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 20))
$$;
revoke all on function public.list_calendar_sync_jobs(integer) from public, anon, authenticated;
grant execute on function public.list_calendar_sync_jobs(integer) to service_role;
