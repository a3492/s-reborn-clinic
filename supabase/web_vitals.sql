-- Core Web Vitals 샘플 적재 (Pages Function /api/vitals → SERVICE ROLE)
-- 선행: migrations/20260403_admin_phase1.sql (public.is_admin)
--
-- 30일 보관: 주기 실행 예시 (SQL Editor 또는 pg_cron)
--   DELETE FROM public.web_vitals WHERE created_at < now() - interval '30 days';

CREATE TABLE IF NOT EXISTS public.web_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  value numeric NOT NULL,
  rating text NOT NULL,
  page text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert" ON public.web_vitals;
CREATE POLICY "anon insert"
  ON public.web_vitals FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "web_vitals_admin_select" ON public.web_vitals;
CREATE POLICY "web_vitals_admin_select"
  ON public.web_vitals FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS web_vitals_created_at_idx ON public.web_vitals (created_at);
CREATE INDEX IF NOT EXISTS web_vitals_name_created_idx ON public.web_vitals (name, created_at DESC);
