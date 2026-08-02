alter table public.partner_profiles add constraint partner_profiles_category_check check (category is null or category in ('location', 'photography', 'catering'));

create table public.partner_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  storage_path text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  style text not null default '' check (char_length(style) <= 80),
  position integer not null default 0 check (position >= 0),
  is_cover boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.partner_portfolio_items enable row level security;
create policy "partners manage own portfolio" on public.partner_portfolio_items for all to authenticated
using (exists (select 1 from public.partner_profiles p where p.id = partner_id and p.owner_id = (select auth.uid())))
with check (exists (select 1 from public.partner_profiles p where p.id = partner_id and p.owner_id = (select auth.uid())));
grant select, insert, update, delete on public.partner_portfolio_items to authenticated;
create index partner_portfolio_items_partner_position_idx on public.partner_portfolio_items(partner_id, position, created_at);
create unique index partner_portfolio_one_cover_idx on public.partner_portfolio_items(partner_id) where is_cover;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
('partner-portfolios','partner-portfolios',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "partners read own portfolio files" on storage.objects for select to authenticated using
(bucket_id='partner-portfolios' and exists (select 1 from public.partner_profiles p where p.id::text=(storage.foldername(name))[1] and p.owner_id=(select auth.uid())));
create policy "partners upload own portfolio files" on storage.objects for insert to authenticated with check
(bucket_id='partner-portfolios' and exists (select 1 from public.partner_profiles p where p.id::text=(storage.foldername(name))[1] and p.owner_id=(select auth.uid())));
create policy "partners update own portfolio files" on storage.objects for update to authenticated using
(bucket_id='partner-portfolios' and exists (select 1 from public.partner_profiles p where p.id::text=(storage.foldername(name))[1] and p.owner_id=(select auth.uid()))) with check
(bucket_id='partner-portfolios' and exists (select 1 from public.partner_profiles p where p.id::text=(storage.foldername(name))[1] and p.owner_id=(select auth.uid())));
create policy "partners delete own portfolio files" on storage.objects for delete to authenticated using
(bucket_id='partner-portfolios' and exists (select 1 from public.partner_profiles p where p.id::text=(storage.foldername(name))[1] and p.owner_id=(select auth.uid())));
