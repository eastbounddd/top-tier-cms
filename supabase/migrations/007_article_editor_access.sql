BEGIN;

-- Article policies trust profiles.role. Only privileged database callers may
-- change a role, and signup metadata must not assign one.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only a privileged account can change profile roles'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'display_name', NEW.email, 'Writer'), 'writer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published stories are public" ON public.articles;
DROP POLICY IF EXISTS "Authenticated team can read permitted articles" ON public.articles;
DROP POLICY IF EXISTS "Writers create own stories" ON public.articles;
DROP POLICY IF EXISTS "Writers update own stories and editors update all" ON public.articles;

CREATE POLICY "Published stories are public" ON public.articles
FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "Authenticated team can read permitted articles" ON public.articles
FOR SELECT TO authenticated USING (
  author_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('owner', 'editor')
  )
);

CREATE POLICY "Writers create own stories" ON public.articles
FOR INSERT TO authenticated WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY "Writers update own stories and editors update all" ON public.articles
FOR UPDATE TO authenticated
USING (
  author_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('owner', 'editor')
  )
)
WITH CHECK (
  author_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('owner', 'editor')
  )
);

COMMIT;
