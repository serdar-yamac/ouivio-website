alter table public.guests
  add column invite_token uuid not null default gen_random_uuid(),
  add column rsvp_responded_at timestamptz;

create unique index guests_invite_token_idx on public.guests(invite_token);

revoke all on table public.guests from anon;

create or replace function public.get_guest_invitation(p_token uuid)
returns table (
  guest_name text,
  partner_names text,
  wedding_date date,
  wedding_location text,
  current_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.name, w.partner_names, w.wedding_date, w.location, g.rsvp_status
  from public.guests g
  join public.weddings w on w.id = g.wedding_id
  where g.invite_token = p_token
  limit 1;
$$;

create or replace function public.submit_guest_rsvp(p_token uuid, p_response text)
returns table (guest_name text, current_status text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_response not in ('accepted', 'declined') then
    raise exception 'Ungültiger RSVP-Status' using errcode = '22023';
  end if;

  return query
  update public.guests as g
  set rsvp_status = p_response,
      rsvp_responded_at = now()
  where g.invite_token = p_token
  returning g.name, g.rsvp_status;
end;
$$;

revoke all on function public.get_guest_invitation(uuid) from public;
revoke all on function public.submit_guest_rsvp(uuid, text) from public;
grant execute on function public.get_guest_invitation(uuid) to anon, authenticated;
grant execute on function public.submit_guest_rsvp(uuid, text) to anon, authenticated;

comment on function public.get_guest_invitation(uuid) is
  'Returns only the minimal invitation data for possession of an unguessable guest token.';
comment on function public.submit_guest_rsvp(uuid, text) is
  'Allows a token holder to set only accepted or declined for the matching guest.';
