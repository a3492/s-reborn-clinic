-- 예약 발행: 15분마다 Edge Function `scheduled-publish` 호출
--
-- 사전 조건
-- 1) Supabase Dashboard → Database → Extensions 에서 `pg_cron`, `pg_net` 활성화
-- 2) Edge Function 배포 및 시크릿 설정: SITE_URL, PUBLISH_SECRET (Cloudflare Pages의 PUBLISH_SECRET과 동일)
-- 3) 아래 URL의 YOUR_PROJECT_REF 를 실제 프로젝트 ref 로 바꿉니다 (Settings → API)
-- 4) Authorization 의 Bearer 토큰을 service_role 키(JWT)로 바꿉니다.
--    운영에서는 Vault(`vault.create_secret` 등)에 두고 SQL에서 조합하는 편이 안전합니다.
--
-- 기존 동일 이름 잡이 있으면 먼저 제거:
-- SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'scheduled-publish';

SELECT cron.schedule(
  'scheduled-publish',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/scheduled-publish',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_JWT_PASTE_HERE'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
