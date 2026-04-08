-- consult_requests 테이블 컬럼 추가 마이그레이션
-- 기존 테이블(name, phone, email, interest, concern, preferred_time, status)에
-- 새 AI 상담 위저드 컬럼을 추가합니다.

ALTER TABLE public.consult_requests
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'ko',
  ADD COLUMN IF NOT EXISTS preferred_contact text,
  ADD COLUMN IF NOT EXISTS concerns jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_recommendations jsonb NOT NULL DEFAULT '[]';

-- status 제약 조건 업데이트 (기존 제약 제거 후 재생성)
ALTER TABLE public.consult_requests
  DROP CONSTRAINT IF EXISTS consult_requests_status_ck;

ALTER TABLE public.consult_requests
  ADD CONSTRAINT consult_requests_status_ck
  CHECK (status IN ('new', 'contacted', 'completed', 'cancelled', 'open'));

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_consult_requests_status ON public.consult_requests (status);
CREATE INDEX IF NOT EXISTS idx_consult_requests_created ON public.consult_requests (created_at DESC);

-- RLS 정책 (없으면 추가)
ALTER TABLE public.consult_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consult_requests_admin_select" ON public.consult_requests;
CREATE POLICY "consult_requests_admin_select" ON public.consult_requests
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "consult_requests_admin_update" ON public.consult_requests;
CREATE POLICY "consult_requests_admin_update" ON public.consult_requests
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consult_requests_updated_at ON public.consult_requests;
CREATE TRIGGER consult_requests_updated_at
  BEFORE UPDATE ON public.consult_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
