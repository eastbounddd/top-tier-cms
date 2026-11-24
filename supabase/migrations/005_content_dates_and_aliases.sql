-- Track editorial changes separately from administrative row updates.
alter table public.articles add column if not exists content_updated_at timestamptz;
alter table public.articles add column if not exists is_sponsored boolean not null default false;
create or replace function public.set_article_content_updated_at() returns trigger language plpgsql as $$
begin
 if row(new.title,new.excerpt,new.body::jsonb,new.cover_image_url,new.category,new.school,new.status,new.is_sponsored)
    is distinct from row(old.title,old.excerpt,old.body::jsonb,old.cover_image_url,old.category,old.school,old.status,old.is_sponsored) then
   new.content_updated_at = now();
 end if;
 return new;
end; $$;
drop trigger if exists articles_content_updated_at on public.articles;
create trigger articles_content_updated_at before update on public.articles for each row execute function public.set_article_content_updated_at();
-- TODO: Verify the intended identity and article title before applying these migrations.
-- These two changes are deliberately explicit so unexpected data stops the migration.
do $$
declare old_writer uuid; correct_writer uuid;
begin
 select id into old_writer from public.writer_profiles where slug='kary-haeth-ca0cf206' and name='Kary Haeth';
 select id into correct_writer from public.writer_profiles where slug='kary-heath-ab2ac1d3' and name='Kary Heath';
 if old_writer is not null and correct_writer is not null then
   update public.articles set writer_profile_id=correct_writer where writer_profile_id=old_writer;
   delete from public.writer_profiles where id=old_writer;
 end if;
 if exists(select 1 from public.articles where slug='n' and title like 'No such thing as a%') then
   if exists(select 1 from public.articles where slug='no-such-thing-as-a-morale-victory-unless') then raise exception 'Target article slug already exists'; end if;
   update public.articles set slug='no-such-thing-as-a-morale-victory-unless' where slug='n' and title like 'No such thing as a%';
 end if;
end $$;
-- Existing generic bios need editorial replacement, without implying invented facts.
update public.writer_profiles set bio='TODO: Add a verified writer biography.' where bio='Profile details are awaiting editorial review.';
