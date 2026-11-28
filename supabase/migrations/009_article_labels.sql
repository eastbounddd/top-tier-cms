BEGIN;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.articles'::regclass
      AND attname = 'labels' AND NOT attisdropped
  ) THEN
    ALTER TABLE public.articles ADD COLUMN labels text[] NOT NULL DEFAULT '{}';

    UPDATE public.articles
    SET labels = array_remove(ARRAY[
      CASE WHEN is_sponsored OR slug IN (
        'pikkit-is-changing-the-way-sports-fans-track-their-bets',
        'top-tier-x-underdog-sports'
      ) THEN 'PARTNER' END,
      CASE WHEN category = 'Breaking News' THEN 'BREAKING'
           WHEN is_top_story AND title !~* '\mflip' THEN 'HOT' END
    ], NULL)
    WHERE is_sponsored OR category = 'Breaking News'
      OR (is_top_story AND title !~* '\mflip')
      OR slug IN ('pikkit-is-changing-the-way-sports-fans-track-their-bets', 'top-tier-x-underdog-sports');
  END IF;
END $$;

UPDATE public.articles SET is_sponsored = true
WHERE 'PARTNER' = ANY(labels) AND is_sponsored IS DISTINCT FROM true;

ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_labels_valid;
ALTER TABLE public.articles ADD CONSTRAINT articles_labels_valid CHECK (
  cardinality(labels) <= 2 AND array_position(labels, NULL) IS NULL
  AND labels <@ ARRAY['BREAKING','HOT','EXCLUSIVE','INSIDER','PREVIEW','RECAP','ANALYSIS','OPINION','PARTNER']::text[]
  AND (cardinality(labels) < 2 OR labels[1] <> labels[2])
);

NOTIFY pgrst, 'reload schema';
COMMIT;
