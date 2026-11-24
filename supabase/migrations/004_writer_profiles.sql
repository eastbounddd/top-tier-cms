-- Public editorial profiles are separate from login accounts and article ownership.
create table if not exists public.writer_profiles (
 id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), name text not null,
 profile_image text, coverage text[] not null default '{}', x_handle text, bio text not null default '', title text, joined_date date
);
alter table public.articles add column if not exists writer_profile_id uuid references public.writer_profiles(id) on delete set null;
create index if not exists articles_writer_profile_idx on public.articles(writer_profile_id, published_at desc);
alter table public.writer_profiles enable row level security;
drop policy if exists "Public writer profiles" on public.writer_profiles;
create policy "Public writer profiles" on public.writer_profiles for select using (true);
drop policy if exists "Editors manage writer profiles" on public.writer_profiles;
create policy "Editors manage writer profiles" on public.writer_profiles for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('owner','editor')))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('owner','editor')));
-- Distinct explicit bylines get distinct profiles; unassigned rows stay visible for review.
insert into public.writer_profiles (slug,name,bio)
select coalesce(nullif(trim(both '-' from regexp_replace(lower(n.name), '[^a-z0-9]+', '-', 'g')), ''), 'writer') || '-' || substr(md5(n.name),1,8), n.name,
       'Profile details are awaiting editorial review.'
from (select min(trim(body->>'author_name')) as name from public.articles where jsonb_typeof(body::jsonb) = 'object' and nullif(trim(body->>'author_name'), '') is not null group by lower(trim(body->>'author_name'))) n
where not exists (select 1 from public.writer_profiles w where lower(trim(w.name))=lower(n.name))
on conflict (slug) do nothing;
update public.articles a set writer_profile_id = w.id from public.writer_profiles w
where a.writer_profile_id is null and nullif(trim(a.body->>'author_name'),'') is not null
and lower(trim(a.body->>'author_name'))=lower(trim(w.name))
and (select count(*) from public.writer_profiles w2 where lower(trim(w2.name))=lower(trim(w.name)))=1;
insert into public.writer_profiles (slug,name,coverage,bio,title)
values ('placeholder-writer-one','Placeholder Writer One',array['College Football'],'Placeholder biography. Replace with writer details.','Placeholder Writer'),
       ('placeholder-writer-two','Placeholder Writer Two',array['Recruiting'],'Placeholder biography. Replace with writer details.','Placeholder Writer')
on conflict (slug) do nothing;
-- Unmatched report: select id,title,slug,body->>'author_name' as byline from public.articles where writer_profile_id is null order by title;
