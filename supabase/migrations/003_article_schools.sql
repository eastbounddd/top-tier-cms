-- Assign articles to an optional school for school-specific coverage pages.
alter table public.articles add column if not exists school text;

create index if not exists articles_school_published_at_idx
on public.articles (school, published_at desc)
where status = 'published' and school is not null;
