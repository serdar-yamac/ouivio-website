create or replace function public.get_apple_calendar_connection_secret()
returns table(connection_id uuid, encrypted_credentials text)
language sql
security definer
set search_path = public, private, auth
as $$
  select connection.id, secret.encrypted_credentials
  from public.calendar_connections connection
  join private.calendar_connection_secrets secret on secret.connection_id = connection.id
  join public.partner_profiles partner on partner.id = connection.partner_id
  where partner.owner_id = auth.uid()
    and connection.provider = 'apple'
    and connection.status = 'connected'
  limit 1
$$;

revoke all on function public.get_apple_calendar_connection_secret() from public, anon;
grant execute on function public.get_apple_calendar_connection_secret() to authenticated;
