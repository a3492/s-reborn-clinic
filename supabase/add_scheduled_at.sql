-- posts 예정 발행일 (어드민 캘린더). 이미 admin_phase1 마이그레이션에 있으면 무시됩니다.
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

COMMENT ON COLUMN public.posts.scheduled_at IS '예정 발행 일시 — 캘린더·예약 발행 관리용';
