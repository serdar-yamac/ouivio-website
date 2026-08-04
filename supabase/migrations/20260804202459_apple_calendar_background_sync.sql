-- Server-only work queue for the Vercel cron route. The function returns
-- encrypted credentials only to Supabase's service role; browser roles cannot
-- execute it and have no direct access to the private secrets table.
create or replace function public.list_apple_calendar_sync_jobs(p_limit integer default 10)
returns table(connection_id uuid, partner_id uuid, encrypted_credentials text)
language sql
security definer
set search_path = public, private
as $$
  select connection.id, connection.partner_id, secret.encrypted_credentials
  from public.calendar_connections connection
  join private.calendar_connection_secrets secret on secret.connection_id = connection.id
  where connection.provider = 'apple'
    and connection.status = 'connected'
  order by connection.last_synced_at asc nulls first, connection.updated_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 20))
$$;

revoke all on function public.list_apple_calendar_sync_jobs(integer) from public, anon, authenticated;
grant execute on function public.list_apple_calendar_sync_jobs(integer) to service_role;
