-- 온라인 상담 신청. is_admin() 은 admin_phase1 마이그레이션 선행.
CREATE TABLE IF NOT EXISTS public.consult_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  age_range text,
  gender text,
  language text NOT NULL DEFAULT 'ko',
  preferred_contact text,
  concerns jsonb NOT NULL DEFAULT '[]',
  answers jsonb NOT NULL DEFAULT '{}',
  ai_summary text,
  ai_recommendations jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'new',
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT consult_requests_status_ck CHECK (status IN ('new', 'contacted', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_consult_requests_status ON public.consult_requests (status);
CREATE INDEX IF NOT EXISTS idx_consult_requests_created ON public.consult_requests (created_at DESC);

ALTER TABLE public.consult_requests ENABLE ROW LEVEL SECURITY;

-- service role(Pages Functions)만 INSERT (anon 직접 삽입 불필요 — API 경유)
DROP POLICY IF EXISTS "consult_requests_admin_select" ON public.consult_requests;
CREATE POLICY "consult_requests_admin_select" ON public.consult_requests
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "consult_requests_admin_update" ON public.consult_requests;
CREATE POLICY "consult_requests_admin_update" ON public.consult_requests
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMENT ON TABLE public.consult_requests IS '온라인 상담 신청 내역';

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
