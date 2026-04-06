# s-reborn-clinic

에스리본 클리닉 공식 사이트 (Astro + Cloudflare Pages).

### Pages 빌드 출력 경로

`npm run build` 후 **배포할 정적 루트는 `dist/client`** 입니다. Cloudflare 대시보드의 **Build output directory**가 `dist`만 가리키면 페이지 HTML이 갱신되지 않은 것처럼 보일 수 있습니다. 루트의 `wrangler.toml`에 `pages_build_output_dir = "dist/client"`가 있으면 Git 연동 빌드에서 이 경로가 사용됩니다.

## 환경 변수

### Astro / 클라이언트

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — 블로그 조회수·반응 등
- `PUBLIC_CF_ANALYTICS_TOKEN` — (선택) [Cloudflare Web Analytics](https://developers.cloudflare.com/analytics/web-analytics/) 비콘 토큰. 없으면 스크립트 미삽입.
- `PUBLIC_GA_MEASUREMENT_ID` — (선택) Google Analytics 4 측정 ID(`G-…`). 없으면 gtag 미삽입. 글 페이지는 `content_id`가 config에 포함되며, 공유·반응·구독은 `gtag`가 있을 때만 커스텀 이벤트 전송.

### Cloudflare Pages Functions

배포 대시보드 또는 로컬 `.dev.vars`에 설정합니다. 예시는 `.dev.vars.example`을 참고하세요.

| 변수 | 설명 |
|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 (구독·발행·알림 API) |
| `GITHUB_TOKEN`, `GITHUB_REPO` | 관리자 발행(GitHub Contents API) |
| `RESEND_API_KEY` | [Resend](https://resend.com) API 키 — 구독 확인 메일·새 글 알림 |
| `FROM_EMAIL` | 발신 주소 (예: `noreply@s-reborn.com`, Resend에서 인증된 도메인) |
| `NOTIFY_SUBSCRIBERS_SECRET` | `POST /api/notify-subscribers` 호출 시 헤더 `x-notify-secret`과 동일한 값 (발행 후 일괄 알림용) |
| `PUBLIC_SITE_URL` | (선택) 알림 메일의 글 링크에 사용할 공개 사이트 URL. 뉴스레터 Edge Function의 `SITE_URL`과 같게 두면 구독 취소·글 링크가 일치합니다 |
| `PUBLISH_SECRET` | (선택) 설정 시 `POST /api/admin/publish`는 `X-Publish-Secret` 일치 또는 관리자 Supabase 세션 `Authorization: Bearer <access_token>` 필요. Supabase Edge Function `scheduled-publish`의 동일 시크릿과 맞출 것 |

### 예약 발행 (Supabase Edge Function + pg_cron)

`scheduled_at`이 지난 **draft** 글을 주기적으로 GitHub에 반영하려면:

1. **Edge Function 배포** (프로젝트 루트에서):
   ```bash
   npx supabase functions deploy scheduled-publish
   ```
2. Supabase Dashboard → **Edge Functions → scheduled-publish → Secrets** 에 다음을 설정:
   - `SITE_URL` — Cloudflare Pages 공개 URL (예: `https://s-reborn-clinic.pages.dev`, 끝 슬래시 없음)
   - `PUBLISH_SECRET` — Pages `.dev.vars` / 대시보드의 `PUBLISH_SECRET` 과 **동일** (미설정 시 로컬만 해당되며, 프로덕션에서 시크릿을 켠 경우 필수)
3. **pg_cron**: `supabase/scheduled_publish_cron.sql` 을 참고해 `pg_net`으로 `functions/v1/scheduled-publish`를 호출합니다. URL·`Authorization: Bearer <service_role>` 는 프로젝트 값으로 치환하세요. (기본 15분마다)

### 주간 뉴스레터 (Edge Function + Resend)

1. 배포: `npx supabase functions deploy weekly-newsletter`
2. Function 시크릿: `RESEND_API_KEY`, `FROM_EMAIL`, `SITE_URL` (공개 사이트 URL — 메일의 구독 취소 링크가 `SITE_URL/api/unsubscribe?email=` 를 가리킵니다)
3. **pg_cron**: `supabase/newsletter_cron.sql` (매주 월요일 00:00 UTC = 09:00 KST)
4. 구독 취소: Cloudflare Pages `GET /api/unsubscribe?email=` 가 `lab_waitlist`에서 해당 이메일을 삭제합니다.

### 동적 OG 이미지 (`/api/og/…`)

- 블로그 글에 썸네일이 없으면 `og:image`가 `https://<사이트>/api/og/<encodeURIComponent(slug)>/` 로 생성됩니다 (Cloudflare Pages Function).
- `satori` + `@resvg/resvg-wasm` 사용. 배포 환경에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 바인딩 필요 (기존 Pages와 동일).
- 첫 요청 시 외부 CDN에서 폰트·WASM을 가져올 수 있습니다.

### 주간 운영 리포트 (Edge Function)

1. 마이그레이션: `20260412_admin_profiles_receive_report.sql` (`receive_report` 컬럼)
2. 배포: `npx supabase functions deploy admin-weekly-report`
3. 시크릿: `RESEND_API_KEY`, `FROM_EMAIL`, (선택) `SITE_URL`
4. 크론: `supabase/admin_weekly_report_cron.sql` — 월요일 08:00 KST (`0 23 * * 0` UTC)
5. Settings → **주간 리포트**에서 owner 수신 토글·수동 발송

## 스크립트

```bash
npm install
npm run dev
npm run build
```

## 데이터베이스

`supabase/migrations/`의 SQL을 Supabase에 적용하세요. 이메일 구독은 `lab_waitlist` 테이블을 사용합니다 (`source`: `lab` | `blog` | `academy` 등).

독자 반응(좋아요 등)에 로그인 사용자를 연결하려면 `20260411_post_reactions_user_id.sql`을 적용하세요.

## 독자 소셜 로그인 (Supabase Auth)

블로그 독자용 `/login` 페이지는 Google·Kakao OAuth(`signInWithOAuth`)를 사용합니다. 어드민 로그인(`/admin/login`)과 UI·플로우가 별도입니다.

### Supabase 대시보드 설정

1. **Authentication → Providers**에서 **Google**, **Kakao**를 켜고 각 콘솔에서 발급한 Client ID·Secret을 입력합니다.
2. **Authentication → URL Configuration**
   - **Site URL**: 프로덕션 기준 URL (예: `https://your-domain.pages.dev`).
   - **Redirect URLs**에 OAuth 완료 후 돌아올 주소를 등록합니다. 최소한 다음을 포함하는 것이 좋습니다.
     - 로컬: `http://localhost:4321/login`, `http://127.0.0.1:4321/login` (포트는 `astro dev`와 동일하게)
     - 배포: `https://your-domain.pages.dev/login` (실제 도메인에 맞게)
3. Kakao Developers 등 외부 콘솔의 **Redirect URI**는 Supabase가 안내하는 값(보통 `https://<project-ref>.supabase.co/auth/v1/callback`)을 사용합니다.

클라이언트에는 기존과 같이 `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`만 있으면 됩니다. Provider 시크릿은 Supabase에만 저장합니다.
