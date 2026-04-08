-- 주간 뉴스레터: 매주 월요일 09:00 KST = 월요일 00:00 UTC
--
-- 사전 조건: pg_cron, pg_net 확장, Edge Function `weekly-newsletter` 배포
-- 시크릿: RESEND_API_KEY, FROM_EMAIL, SITE_URL (공개 사이트 — /unsubscribe 구독 취소 페이지)
--
-- YOUR_PROJECT_REF · SERVICE_ROLE_JWT 를 실제 값으로 바꾼 뒤 실행하세요.
-- 기존 잡 제거: SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'weekly-newsletter';

SELECT cron.schedule(
  'weekly-newsletter',
  '0 0 * * 1',
  $cron$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-newsletter',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_JWT_PASTE_HERE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
