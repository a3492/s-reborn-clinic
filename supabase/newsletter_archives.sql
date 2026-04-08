-- 주간 뉴스레터 발송본 공개 아카이브 (weekly-newsletter Edge Function이 INSERT)
CREATE TABLE IF NOT EXISTS public.newsletter_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html_body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  recipient_count int NOT NULL DEFAULT 0
);

ALTER TABLE public.newsletter_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read newsletter_archives" ON public.newsletter_archives;
CREATE POLICY "anon read newsletter_archives"
  ON public.newsletter_archives FOR SELECT TO anon
  USING (true);

COMMENT ON TABLE public.newsletter_archives IS 'Resend로 발송된 주간 뉴스레터 HTML 스냅샷(공개 조회 전용)';
