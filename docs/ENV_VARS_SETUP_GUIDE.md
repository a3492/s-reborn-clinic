# 환경변수 설정 운영 가이드

> S-Reborn 프로젝트 공통 — 최종 수정: 2026-04-08

---

## 프로젝트 목록

| 프로젝트 | Cloudflare Pages 프로젝트명 | 배포 URL |
|---|---|---|
| **클리닉** (`s-reborn-clinic`) | `s-reborn-clinic` | https://s-reborn-clinic.pages.dev |
| **블로그** (`s-reborn-blog-temp`) | `s-reborn-blog` | https://s-reborn-blog.pages.dev |

---

## 1. Cloudflare Pages 환경변수 설정 방법

### 1-1. 대시보드 접속 경로

```
Cloudflare 대시보드
  → Workers & Pages
    → [프로젝트명] 클릭
      → Settings 탭
        → Environment variables
          → Add variable
```

직접 링크:
- 클리닉: https://dash.cloudflare.com/?to=/:account/pages/view/s-reborn-clinic/settings/environment-variables
- 블로그: https://dash.cloudflare.com/?to=/:account/pages/view/s-reborn-blog/settings/environment-variables

### 1-2. Production / Preview 구분

Cloudflare Pages는 환경변수를 **Production**과 **Preview** 두 곳에 각각 설정한다.
민감한 키는 **Production에만** 설정하고 Preview는 테스트용 값(또는 빈값)을 유지할 것.

### 1-3. 변수 추가 순서

1. `Add variable` 버튼 클릭
2. **Variable name** 입력 (예: `OPENAI_API_KEY`)
3. **Value** 입력 (실제 API 키)
4. 민감한 값은 `Encrypt` 토글 활성화 → 저장 후 값을 다시 볼 수 없음
5. `Save` 클릭
6. **배포를 다시 트리거해야 반영됨** → Deployments 탭 → 최신 배포 오른쪽 `...` → `Retry deployment`

---

## 2. OPENAI_API_KEY 추가 방법 (AI 상담 분석 기능)

### 2-1. API 키 발급

1. https://platform.openai.com/api-keys 접속
2. **+ Create new secret key** 클릭
3. Name: `s-reborn-clinic-prod` (식별용)
4. 생성된 키 복사 — **이 창을 닫으면 다시 볼 수 없음**

### 2-2. Cloudflare Pages에 등록

| 항목 | 값 |
|---|---|
| Variable name | `OPENAI_API_KEY` |
| Value | `sk-proj-...` (발급받은 키) |
| Encrypt | ✅ 반드시 체크 |
| Environment | Production |

### 2-3. 등록 후 배포 재트리거

```
Cloudflare 대시보드
  → s-reborn-clinic
    → Deployments
      → 최신 배포 [...] → Retry deployment
```

또는 Git에 아무 커밋이나 푸시하면 자동 재배포 트리거됨.

### 2-4. 동작 확인

`/api/consult-ai` 엔드포인트 작동 흐름:

```
OPENAI_API_KEY 있음  →  GPT-4o-mini 호출 → AI 분석 결과 반환
OPENAI_API_KEY 없음  →  폴백 응답 반환 (상담 신청 자체는 정상 작동)
```

---

## 3. 전체 환경변수 목록

### 3-1. s-reborn-clinic (클리닉)

| 변수명 | 필수 | 설명 | 설정 위치 |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase 프로젝트 URL | CF Pages + `.dev.vars` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 서비스 롤 키 (비공개) | CF Pages + `.dev.vars` |
| `SUPABASE_ANON_KEY` | 선택 | OAuth 댓글용 | CF Pages + `.dev.vars` |
| `PUBLIC_SUPABASE_URL` | ✅ | 클라이언트용 Supabase URL | `.env` (빌드 번들) |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ | 클라이언트용 anon 키 | `.env` (빌드 번들) |
| `TURNSTILE_SECRET_KEY` | ✅ | Cloudflare Turnstile 서버 검증 키 | CF Pages + `.dev.vars` |
| `PUBLIC_TURNSTILE_SITE_KEY` | ✅ | Turnstile 사이트 키 (공개) | `.env` (빌드 번들) |
| `RESEND_API_KEY` | ✅ | 이메일 발송 (Resend) | CF Pages + `.dev.vars` |
| `FROM_EMAIL` | ✅ | 발신자 이메일 | CF Pages + `.dev.vars` |
| `ADMIN_EMAIL` | 선택 | 관리자 수신 이메일 (쉼표 구분 가능) | CF Pages + `.dev.vars` |
| `NOTIFY_SUBSCRIBERS_SECRET` | ✅ | 구독자 알림 API 보안 토큰 | CF Pages + `.dev.vars` |
| `PUBLISH_SECRET` | ✅ | 예약 발행 검증 토큰 | CF Pages + `.dev.vars` |
| **`OPENAI_API_KEY`** | 선택 | AI 상담 분석 (`/api/consult-ai`) | CF Pages + `.dev.vars` |
| `R2_ACCOUNT_ID` | 선택 | Cloudflare R2 계정 ID | CF Pages + `.dev.vars` |
| `R2_ACCESS_KEY_ID` | 선택 | R2 접근 키 | CF Pages + `.dev.vars` |
| `R2_SECRET_ACCESS_KEY` | 선택 | R2 비밀 키 | CF Pages + `.dev.vars` |
| `R2_BUCKET_NAME` | 선택 | R2 버킷명 | CF Pages + `.dev.vars` |
| `R2_PUBLIC_URL` | 선택 | R2 공개 URL | CF Pages + `.dev.vars` |
| `PUBLIC_R2_MEDIA_URL` | 선택 | 클라이언트용 R2 URL | `.env` (빌드 번들) |
| `PUBLIC_SITE_URL` | 선택 | 사이트 원점 URL (이메일 링크용) | `.env` (빌드 번들) |

### 3-2. s-reborn-blog (블로그)

| 변수명 | 필수 | 설명 | 설정 위치 |
|---|---|---|---|
| `PUBLIC_SUPABASE_URL` | ✅ | 클라이언트용 Supabase URL | `.env` (빌드 번들) |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ | 클라이언트용 anon 키 | `.env` (빌드 번들) |
| `SUPABASE_URL` | ✅ | Supabase 프로젝트 URL | CF Pages + `.dev.vars` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase 서비스 롤 키 | CF Pages + `.dev.vars` |
| `GITHUB_TOKEN` | ✅ | GitHub PAT (글 발행용) | CF Pages + `.dev.vars` |
| `GITHUB_REPO` | ✅ | `org/repo` 형식 | CF Pages + `.dev.vars` |
| `GITHUB_BRANCH` | 선택 | 기본값 `main` | CF Pages + `.dev.vars` |
| `RESEND_API_KEY` | ✅ | 이메일 발송 | CF Pages + `.dev.vars` |
| `FROM_EMAIL` | ✅ | 발신자 이메일 | CF Pages + `.dev.vars` |
| `NOTIFY_SUBSCRIBERS_SECRET` | ✅ | 구독자 알림 보안 토큰 | CF Pages + `.dev.vars` |
| **`OPENAI_API_KEY`** | 선택 | 포스트 임베딩 생성 (Supabase Edge Function) | CF Pages + `.dev.vars` |
| `R2_ACCOUNT_ID` | 선택 | Cloudflare R2 계정 ID | CF Pages + `.dev.vars` |
| `R2_ACCESS_KEY_ID` | 선택 | R2 접근 키 | CF Pages + `.dev.vars` |
| `R2_SECRET_ACCESS_KEY` | 선택 | R2 비밀 키 | CF Pages + `.dev.vars` |
| `R2_BUCKET_NAME` | 선택 | R2 버킷명 | CF Pages + `.dev.vars` |
| `R2_PUBLIC_URL` | 선택 | R2 공개 URL | CF Pages + `.dev.vars` |

---

## 4. 로컬 개발 환경 설정

### 4-1. 파일 구조

```
프로젝트 루트/
  .env              ← PUBLIC_* 변수 (Astro 빌드 번들에 포함, Git 제외)
  .env.example      ← .env 템플릿 (Git 포함)
  .dev.vars         ← CF Pages Functions 로컬용 비밀 변수 (Git 제외)
  .dev.vars.example ← .dev.vars 템플릿 (Git 포함)
```

### 4-2. 초기 세팅

```bash
# 1. 템플릿 복사
cp .env.example .env
cp .dev.vars.example .dev.vars

# 2. 각 파일의 빈 값 채우기 (편집기로 직접)

# 3. 로컬 개발 서버 실행
npx wrangler pages dev dist --compatibility-date=2024-09-23
# 또는 npm run dev (Astro 전용, Functions 미포함)
```

### 4-3. 주의사항

- `.env`와 `.dev.vars`는 절대 Git에 커밋하지 않는다 (`.gitignore`에 등록됨)
- `PUBLIC_` 접두사 변수는 브라우저에 노출되므로 비밀 값을 절대 넣지 않는다
- Cloudflare Pages에서 `PUBLIC_*` 변수는 **빌드 시 번들에 포함**되므로 CF Pages Settings → Environment variables에 등록해야 배포 빌드에 반영됨

---

## 5. Supabase 관련 키 찾는 곳

```
https://supabase.com/dashboard/project/[project-ref]/settings/api
```

| 키 이름 | 위치 |
|---|---|
| `SUPABASE_URL` / `PUBLIC_SUPABASE_URL` | Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` `secret` |

현재 클리닉 프로젝트 레퍼런스: `dprwrvmzuhukcyrjqstu`

---

## 6. 환경변수 변경 후 체크리스트

- [ ] CF Pages 대시보드에 변수 추가/수정 완료
- [ ] Encrypt 토글 확인 (민감한 값)
- [ ] Production/Preview 환경 모두 설정 필요한지 확인
- [ ] Deployments → Retry deployment 또는 Git push로 재배포
- [ ] 배포 완료 후 해당 기능 실제 동작 확인

---

## 7. 트러블슈팅

### 환경변수가 반영되지 않을 때
→ 변수 등록 후 반드시 **재배포** 필요. 자동으로 반영되지 않음.

### `Server misconfigured` 에러가 날 때
→ `SUPABASE_URL` 또는 `SUPABASE_SERVICE_ROLE_KEY`가 CF Pages에 등록되지 않은 것.
→ `.env`가 아닌 CF Pages Settings에 등록해야 함.

### AI 분석이 폴백 응답만 나올 때
→ `OPENAI_API_KEY`가 CF Pages에 등록되지 않은 것.
→ 폴백 응답 자체는 정상 동작이므로 상담 신청서 제출에는 영향 없음.

### 로컬에서 Functions API가 404를 반환할 때
→ `npm run dev` 대신 `npx wrangler pages dev dist`로 실행해야 Functions가 작동함.
