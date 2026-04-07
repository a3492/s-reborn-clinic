-- 주간 운영 리포트 수신 여부 (owner 대상, 기본 true)
ALTER TABLE public.admin_profiles
  ADD COLUMN IF NOT EXISTS receive_report boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.admin_profiles.receive_report IS '주간 운영 리포트 이메일 수신 (owner 권장)';
