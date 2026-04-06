-- 독자 글 오류 신고. is_admin() 은 admin_phase1 마이그레이션 선행.
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  report_type text NOT NULL,
  description text,
  reporter_email text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT post_reports_type_ck CHECK (report_type IN ('typo', 'factual_error', 'outdated', 'other')),
  CONSTRAINT post_reports_status_ck CHECK (status IN ('open', 'resolved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_post_reports_slug ON public.post_reports (slug);
CREATE INDEX IF NOT EXISTS idx_post_reports_slug_open ON public.post_reports (slug) WHERE status = 'open';

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- 공개 제출: anon 키로 직접 INSERT 할 때 (또는 호환용). API는 service role로도 삽입 가능.
DROP POLICY IF EXISTS "anon insert" ON public.post_reports;
CREATE POLICY "anon insert" ON public.post_reports FOR INSERT TO anon WITH CHECK (true);

-- 원문 스펙의 authenticated 전체 SELECT 대신 관리자만 조회·수정 (의료 신고 유출 방지)
DROP POLICY IF EXISTS "admin read" ON public.post_reports;
DROP POLICY IF EXISTS "post_reports_admin_select" ON public.post_reports;
CREATE POLICY "post_reports_admin_select" ON public.post_reports
  FOR SELECT TO authenticated USING (public.is_admin ());

DROP POLICY IF EXISTS "post_reports_admin_update" ON public.post_reports;
CREATE POLICY "post_reports_admin_update" ON public.post_reports
  FOR UPDATE TO authenticated USING (public.is_admin ()) WITH CHECK (public.is_admin ());

COMMENT ON TABLE public.post_reports IS '블로그 글 오류·오탈자 독자 신고';
