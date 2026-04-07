-- 의료 콘텐츠 주기 검토 (Task 52). posts 행별 검토 주기·플래그.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_interval_days int DEFAULT 180,
  ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;

COMMENT ON COLUMN public.posts.last_reviewed_at IS '에디터가「검토 완료」로 기록한 시각 (발행일과 별도)';
COMMENT ON COLUMN public.posts.review_interval_days IS '다음 자동 검토 알림까지 일수 (30~365 권장)';
COMMENT ON COLUMN public.posts.needs_review IS '주기 초과 등으로 검토가 필요함 (발행 차단 아님)';
