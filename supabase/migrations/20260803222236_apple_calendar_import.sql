create or replace function public.save_apple_calendar_connection(
  p_encrypted_credentials text,
  p_account_label text
) returns uuid
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_partner_id uuid;
  v_connection_id uuid;
begin
  select id into v_partner_id from public.partner_profiles where owner_id = auth.uid();
  if v_partner_id is null then raise exception 'Partnerkonto erforderlich'; end if;
  if char_length(p_encrypted_credentials) < 32 or char_length(p_encrypted_credentials) > 4096 then raise exception 'Ungültige Zugangsdaten'; end if;

  insert into public.calendar_connections (partner_id, provider, external_account_label, external_calendar_id, status, sync_direction, last_synced_at)
  values (v_partner_id, 'apple', left(p_account_label, 254), 'icloud-default', 'connected', 'import', now())
  on conflict (partner_id, provider, external_calendar_id) do update
    set external_account_label = excluded.external_account_label,
        status = 'connected', sync_direction = 'import', last_synced_at = now(), updated_at = now()
  returning id into v_connection_id;

  insert into private.calendar_connection_secrets (connection_id, encrypted_credentials, updated_at)
  values (v_connection_id, p_encrypted_credentials, now())
  on conflict (connection_id) do update set encrypted_credentials = excluded.encrypted_credentials, updated_at = now();
  return v_connection_id;
end;
$$;

revoke all on function public.save_apple_calendar_connection(text, text) from public, anon;
grant execute on function public.save_apple_calendar_connection(text, text) to authenticated;
