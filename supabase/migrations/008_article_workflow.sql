DO $$
DECLARE status_enum regtype;
BEGIN
  SELECT a.atttypid::regtype INTO status_enum FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid WHERE a.attrelid = 'public.articles'::regclass AND a.attname = 'status' AND t.typtype = 'e';
  IF status_enum IS NOT NULL THEN
    EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', status_enum, 'ready_for_review');
    EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', status_enum, 'scheduled');
  END IF;
END $$;

BEGIN;

-- Replace status-only checks while preserving existing rows.
DO $$
DECLARE constraint_row record;
BEGIN
  FOR constraint_row IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.articles'::regclass AND contype = 'c'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute
        WHERE attrelid = 'public.articles'::regclass AND attname = 'status')]
  LOOP
    EXECUTE format('ALTER TABLE public.articles DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END $$;

ALTER TABLE public.articles ADD CONSTRAINT articles_workflow_status_check
  CHECK (status::text IN ('draft', 'pending_review', 'ready_for_review', 'scheduled', 'published')) NOT VALID;

DROP POLICY IF EXISTS "Authenticated team can read permitted articles" ON public.articles;
CREATE POLICY "Authenticated team can read permitted articles" ON public.articles
FOR SELECT TO authenticated USING (
  author_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('owner', 'editor', 'admin'))
);
DROP POLICY IF EXISTS "Writers update own stories and editors update all" ON public.articles;
CREATE POLICY "Writers update own stories and editors update all" ON public.articles
FOR UPDATE TO authenticated USING (
  author_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('owner', 'editor', 'admin'))
) WITH CHECK (
  author_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role::text IN ('owner', 'editor', 'admin'))
);
DROP POLICY IF EXISTS "Published stories are public" ON public.articles;
CREATE POLICY "Published stories are public" ON public.articles
FOR SELECT TO anon, authenticated USING (
  status = 'published' OR (status::text = 'scheduled' AND published_at <= now())
);

CREATE OR REPLACE FUNCTION public.enforce_article_workflow()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user = 'authenticated' AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('owner', 'editor', 'admin')
  ) THEN
    IF TG_OP = 'DELETE' THEN
      IF OLD.status::text IN ('published', 'scheduled') THEN
        RAISE EXCEPTION 'Only editors can delete published or scheduled stories' USING ERRCODE = '42501';
      END IF;
      RETURN OLD;
    END IF;
    IF NEW.status::text NOT IN ('draft', 'ready_for_review', 'pending_review') THEN
      RAISE EXCEPTION 'Only editors can publish or schedule articles' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND (OLD.status::text IN ('published', 'scheduled') OR NEW.author_id IS DISTINCT FROM OLD.author_id) THEN
      RAISE EXCEPTION 'Only editors can change published or scheduled articles or their owner' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_article_workflow ON public.articles;
CREATE TRIGGER enforce_article_workflow BEFORE INSERT OR UPDATE OR DELETE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.enforce_article_workflow();

CREATE INDEX IF NOT EXISTS articles_secondary_school_idx
ON public.articles ((body->>'secondary_school'));

NOTIFY pgrst, 'reload schema';
COMMIT;
