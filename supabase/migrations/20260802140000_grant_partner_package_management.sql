-- Package policies already limit every write to the owning partner profile.
-- The Data API additionally requires explicit table privileges for these actions.
grant insert, update, delete on public.partner_packages to authenticated;
