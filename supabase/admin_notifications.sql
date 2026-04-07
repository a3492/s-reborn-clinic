-- 관리자 알림 센터 (Realtime). comments 테이블이 이미 있어야 댓글 트리거 생성이 성공합니다 (comments.sql 선행 권장).
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  -- 'new_comment' | 'new_report' | 'publish_failed' | 'new_subscriber' | 'publish_success'
  title text NOT NULL,
  body text,
  resource_slug text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON public.admin_notifications (is_read) WHERE is_read = false;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all" ON public.admin_notifications;
CREATE POLICY "admin all"
  ON public.admin_notifications FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 30일 초과 알림 정리 (스케줄러·수동 호출용)
CREATE OR REPLACE FUNCTION public.purge_old_admin_notifications()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.admin_notifications
    WHERE created_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT coalesce(count(*)::integer, 0) FROM deleted;
$$;

REVOKE ALL ON FUNCTION public.purge_old_admin_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_old_admin_notifications() TO authenticated;

-- 새 댓글 → 관리자 알림 (anon/인증 삽입 모두 트리거)
CREATE OR REPLACE FUNCTION public.notify_admin_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, resource_slug)
  VALUES (
    'new_comment',
    '새 댓글: ' || NEW.slug,
    left(coalesce(NEW.body, ''), 240),
    NEW.slug
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_admin_notification ON public.comments;
CREATE TRIGGER trg_comments_admin_notification
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_comment();

-- Realtime (멱등)
DO $rt$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  END IF;
END $rt$;

COMMENT ON TABLE public.admin_notifications IS '관리자 패널 알림 (발행·구독·신고·댓글 등)';
