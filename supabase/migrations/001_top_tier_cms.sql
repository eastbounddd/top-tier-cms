-- Run this once in Supabase SQL Editor. It is safe with your existing tables.
create extension if not exists pgcrypto;

alter table public.articles add column if not exists is_top_story boolean not null default false;
alter table public.articles add column if not exists scheduled_for timestamptz;
alter table public.articles add column if not exists view_count bigint not null default 0;

-- Keep updated_at current.
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at before update on public.articles
for each row execute function public.update_updated_at();

-- Automatically create a profile for every Auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email, 'Writer'),
    coalesce(new.raw_user_meta_data->>'role', 'writer')
  ) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.article_media enable row level security;

-- Remove older policies so these rules are predictable.
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='articles' loop
    execute format('drop policy if exists %I on public.articles', p.policyname);
  end loop;
  for p in select policyname from pg_policies where schemaname='public' and tablename='profiles' loop
    execute format('drop policy if exists %I on public.profiles', p.policyname);
  end loop;
end $$;

create policy "Published stories are public" on public.articles
for select using (status='published' or author_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('owner','editor')));
create policy "Writers create own stories" on public.articles
for insert to authenticated with check (author_id=auth.uid());
create policy "Writers update own stories and editors update all" on public.articles
for update to authenticated using (author_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('owner','editor')))
with check (author_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('owner','editor')));
create policy "Writers delete own drafts and editors delete all" on public.articles
for delete to authenticated using ((author_id=auth.uid() and status<>'published') or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('owner','editor')));

create policy "Authenticated users read team profiles" on public.profiles
for select to authenticated using (true);
create policy "Users update own profile" on public.profiles
for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

-- Storage buckets. Increase limits later if needed. Public media is required for article rendering.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('article-images','article-images',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('article-videos','article-videos',true,262144000,array['video/mp4'])
on conflict (id) do update set public=true;

-- Replace storage policies for these buckets.
drop policy if exists "Top Tier media public read" on storage.objects;
drop policy if exists "Top Tier writers upload media" on storage.objects;
drop policy if exists "Top Tier writers update own media" on storage.objects;
drop policy if exists "Top Tier writers delete own media" on storage.objects;
create policy "Top Tier media public read" on storage.objects for select using (bucket_id in ('article-images','article-videos'));
create policy "Top Tier writers upload media" on storage.objects for insert to authenticated with check (bucket_id in ('article-images','article-videos') and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Top Tier writers update own media" on storage.objects for update to authenticated using (bucket_id in ('article-images','article-videos') and owner_id=auth.uid());
create policy "Top Tier writers delete own media" on storage.objects for delete to authenticated using (bucket_id in ('article-images','article-videos') and owner_id=auth.uid());

-- Confirm your owner account. Change the email if needed.
update public.profiles set role='owner' where display_name='partners@ttmediaco.net';
