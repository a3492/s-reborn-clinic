# s-reborn-clinic

에스리본 클리닉 공식 사이트 (Astro + Cloudflare Pages).

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
| `PUBLIC_SITE_URL` | (선택) 알림 메일의 글 링크에 사용할 공개 사이트 URL |

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
