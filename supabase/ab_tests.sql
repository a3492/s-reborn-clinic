-- 제목 A/B 테스트. public.is_admin() 은 admin_phase1 선행.
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title_a text NOT NULL,
  title_b text NOT NULL,
  views_a int DEFAULT 0 NOT NULL,
  views_b int DEFAULT 0 NOT NULL,
  clicks_a int DEFAULT 0 NOT NULL,
  clicks_b int DEFAULT 0 NOT NULL,
  winner text CHECK (winner IS NULL OR winner IN ('a', 'b', 'none')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS ab_tests_one_active_per_slug ON public.ab_tests (slug) WHERE ended_at IS NULL;

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read active" ON public.ab_tests;
CREATE POLICY "anon read active"
  ON public.ab_tests FOR SELECT TO anon USING (ended_at IS NULL);

DROP POLICY IF EXISTS "anon update counts" ON public.ab_tests;
CREATE POLICY "anon update counts"
  ON public.ab_tests FOR UPDATE TO anon
  USING (ended_at IS NULL)
  WITH CHECK (ended_at IS NULL);

DROP POLICY IF EXISTS "ab_tests_admin_select" ON public.ab_tests;
CREATE POLICY "ab_tests_admin_select"
  ON public.ab_tests FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "ab_tests_admin_insert" ON public.ab_tests;
CREATE POLICY "ab_tests_admin_insert"
  ON public.ab_tests FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ab_tests_admin_update" ON public.ab_tests;
CREATE POLICY "ab_tests_admin_update"
  ON public.ab_tests FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ab_tests_admin_delete" ON public.ab_tests;
CREATE POLICY "ab_tests_admin_delete"
  ON public.ab_tests FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.increment_ab_views(test_id uuid, variant text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF variant IS NULL OR variant NOT IN ('a', 'b') THEN
    RETURN;
  END IF;
  IF variant = 'a' THEN
    UPDATE public.ab_tests SET views_a = views_a + 1 WHERE id = test_id AND ended_at IS NULL;
  ELSE
    UPDATE public.ab_tests SET views_b = views_b + 1 WHERE id = test_id AND ended_at IS NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ab_clicks(test_id uuid, variant text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF variant IS NULL OR variant NOT IN ('a', 'b') THEN
    RETURN;
  END IF;
  IF variant = 'a' THEN
    UPDATE public.ab_tests SET clicks_a = clicks_a + 1 WHERE id = test_id AND ended_at IS NULL;
  ELSE
    UPDATE public.ab_tests SET clicks_b = clicks_b + 1 WHERE id = test_id AND ended_at IS NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ab_views(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ab_clicks(uuid, text) TO anon, authenticated;

COMMENT ON TABLE public.ab_tests IS '블로그 목록 제목 A/B 테스트 (진행 중만 anon 조회)';
