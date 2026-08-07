-- Top Tier CMS media repair.
-- Safe to run more than once.

insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'article-images',
    'article-images',
    true,
    15728640,
    array['image/jpeg','image/png','image/webp']
  )
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'article-videos',
    'article-videos',
    true,
    262144000,
    array['video/mp4']
  )
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Top Tier media public read" on storage.objects;
drop policy if exists "Top Tier writers upload media" on storage.objects;
drop policy if exists "Top Tier writers update own media" on storage.objects;
drop policy if exists "Top Tier writers delete own media" on storage.objects;

create policy "Top Tier media public read"
on storage.objects
for select
using (bucket_id in ('article-images','article-videos'));

create policy "Top Tier writers upload media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('article-images','article-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Top Tier writers update own media"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('article-images','article-videos')
  and owner_id = auth.uid()
)
with check (
  bucket_id in ('article-images','article-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Top Tier writers delete own media"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('article-images','article-videos')
  and owner_id = auth.uid()
);
