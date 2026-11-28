BEGIN;

CREATE OR REPLACE VIEW public.dashboard_articles
WITH (security_invoker = true) AS
SELECT a.id, a.title, a.slug, a.category, a.school,
       nullif(btrim(a.body->>'secondary_school'), '') AS secondary_school,
       a.writer_profile_id, a.author_id,
       coalesce(nullif(btrim(w.name), ''), nullif(btrim(a.body->>'author_name'), ''),
                nullif(btrim(a.author_name), '')) AS author_name,
       lower(coalesce(nullif(btrim(w.name), ''), nullif(btrim(a.body->>'author_name'), ''),
                      nullif(btrim(a.author_name), ''))) AS author_sort,
       lower(a.title) AS headline_sort,
       lower(coalesce(nullif(btrim(a.school), ''), nullif(btrim(a.body->>'secondary_school'), ''))) AS school_sort,
       CASE
         WHEN a.status::text = 'pending_review' THEN 'ready_for_review'
         WHEN a.status::text = 'scheduled' AND a.published_at <= now() THEN 'published'
         ELSE a.status::text
       END AS status,
       a.labels, coalesce('PARTNER' = ANY(a.labels), a.is_sponsored, false) AS is_partner,
       coalesce(a.is_top_story, false) AS is_top_story, a.published_at, a.updated_at
FROM public.articles a
LEFT JOIN public.writer_profiles w ON w.id = a.writer_profile_id
WHERE a.author_id = (SELECT auth.uid()) OR EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('owner', 'editor', 'admin')
);

REVOKE ALL ON public.dashboard_articles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.dashboard_articles TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_article_options()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'bylines', coalesce(
      (SELECT jsonb_agg(DISTINCT author_name ORDER BY author_name) FROM public.dashboard_articles
       WHERE writer_profile_id IS NULL AND author_name IS NOT NULL), '[]'::jsonb),
    'categories', coalesce(
      (SELECT jsonb_agg(DISTINCT category ORDER BY category) FROM public.dashboard_articles
       WHERE category IS NOT NULL), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.dashboard_article_options() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_article_options() TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
