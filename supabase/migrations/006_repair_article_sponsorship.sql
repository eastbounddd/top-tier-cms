ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
