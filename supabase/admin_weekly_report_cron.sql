-- 주간 운영 리포트: 매주 월요일 08:00 KST = 일요일 23:00 UTC
--
-- 사전 조건: Edge Function `admin-weekly-report` 배포, Resend 시크릿
-- YOUR_PROJECT_REF · SERVICE_ROLE_JWT 치환 후 실행

SELECT cron.schedule(
  'admin-weekly-report',
  '0 23 * * 0',
  $cron$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-weekly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_JWT_PASTE_HERE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
