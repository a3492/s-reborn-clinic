-- 오래된 published 글 검토 플래그: 매일 09:00 KST = 매일 00:00 UTC
--
-- 사전 조건: Edge Function `flag-stale-posts` 배포, pg_cron·pg_net 확장
-- YOUR_PROJECT_REF · SERVICE_ROLE_JWT 치환 후 실행

SELECT cron.schedule(
  'flag-stale-posts-daily',
  '0 0 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/flag-stale-posts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_JWT_PASTE_HERE',
      'apikey', 'SERVICE_ROLE_JWT_PASTE_HERE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
