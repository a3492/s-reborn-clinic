#    Claude Code / 다음 작업자용 핸드오프

작업 세션이 끝날 때마다 **아래 “최근 작업 스냅샷”을 갱신**하거나, 이 목차를 복사해 채워 Claude Code(또는 다른 에이전트)에게 붙여 넣으면 됩니다.

---

## 보고 템플릿 (복사용)

```
## 레포 / 브랜치
- 경로: c:\dev\s-reborn-clinic
- 브랜치: main (또는 ___)
- 배포: Cloudflare Pages (site: astro.config.mjs 의 site)

## 이번에 한 일 (요약)
- 

## 변경·추가된 주요 경로
- 

## 빌드·검증
- npm run build: 통과 / 실패 (이유)
- 수동 확인: (브라우저에서 본 페이지)

## 알려둘 이슈 / 기술 부채
- 

## 다음에 하면 좋은 일
- 
```

---

## 최근 작업 스냅샷 (갱신일: 2026-04-08)

### 레포 / 브랜치
- **경로**: `c:\dev\s-reborn-clinic`
- **브랜치**: `main`
- **사이트 URL**: `https://s-reborn-clinic.pages.dev`

### 완료된 작업 요약 (2026-04-05 ~ 2026-04-08)

#### 시술 안내 페이지 (`/procedures`) — 모노폴라 RF 콘텐츠 기초작업
- `src/content/procedures/monopolar-rf.md` — 메인 카드 (제목: "모노폴라 / 바이폴라 RF", slug: `monopolar-rf`)
- `monopolar-rf--overview.md` — RF 원리·모노폴라 vs 바이폴라 비교·콜라겐 기전 (topic_order: 1)
- `monopolar-rf--equipment.md` — 써마지 FLX / 비너스 레거시 / 폴라리스 장비 비교·치료팁 종류 (topic_order: 2)
- `monopolar-rf--protocol.md` — 시술 전 준비, 패스 방식, 횟수·간격 프로토콜, 시술 후 관리 (topic_order: 3)
- `monopolar-rf--combination.md` — RF+HIFU / 보톡스 / 필러 / 스킨부스터 병합 전략·순서 (topic_order: 4)
- `monopolar-rf--faq.md` — 자주 묻는 질문 10개 (효과 시점, 통증, 횟수, HIFU 비교 등) (topic_order: 5)
- `procedure-catalog.ts`에 `monopolar-rf` slug 연결 완료

#### 시술 페이지 인프라
- `src/layouts/ProcedurePage.astro` — `WebVitalsCollector` 컴포넌트 추가
- `src/pages/procedures.astro` 삭제 → `src/pages/procedures/index.astro` + `[slug].astro` 로 분리 (이전 커밋)
- OG 이미지 동적 생성: `functions/api/og/[slug].ts`, `functions/api/admin/og-fetch.ts`
- FAQPage JSON-LD Schema, 블로그-시술 연결 링크 (이전 커밋)

#### 신규 기능 (커밋된 것 포함)
- **WebVitals 수집**: `src/components/WebVitalsCollector.astro`, `src/lib/web-vitals-client.ts`, `functions/api/vitals.ts`, `supabase/web_vitals.sql`
- **Poll(투표) 컴포넌트**: `src/components/Poll.astro`, `supabase/polls.sql`
- **관리자 커맨드 팔레트**: `src/components/admin/CommandPalette.astro`
- **관리자 알림 센터**: `src/pages/admin/notifications/`
- **게시물 템플릿**: `src/pages/admin/templates/`, `supabase/post_templates.sql`
- **게시물 버전 관리**: `supabase/post_versions.sql`
- **RSS 피드**: `src/pages/rss/`, `src/lib/rss-feed.ts`
- **검색 페이지**: `src/pages/search.astro`
- **i18n 기반**: `src/i18n/`
- **블로그 TOC**: `src/lib/blog-post-toc.ts`
- **블로그 마크다운 다운로드**: `src/lib/blog-post-download-markdown.ts`
- **면책조항(Disclaimers)**: `src/lib/disclaimers.ts`, `supabase/disclaimers.sql`, `src/pages/api/admin/disclaimers.ts`
- **회원 페이지**: `src/pages/my/`
- **파일 업로드 API**: `functions/api/admin/upload.ts`
- **계정 삭제 API**: `functions/api/delete-account.ts`
- **구독 해지 API**: `functions/api/unsubscribe.ts`
- **Cached API**: `functions/api/cached/`
- **Functions 공통 라이브러리**: `functions/lib/`
- **robots.txt**: `public/robots.txt` (정적 파일), `src/pages/robots.txt.ts` 삭제
- **wrangler.toml**: KV 네임스페이스 바인딩 설정
- **Supabase 마이그레이션**: `20260406_comments_user_id`, `20260412_admin_profiles_receive_report`
- **페이비콘**: SC 대각선 분할 금색/핑크 SVG

#### 콘텐츠
- 클리닉 뉴스: `thermage-key-doctor.md` (써마지 핵심 의사 관련)
- 블로그 콘텐츠 전반 메타데이터 보강 (doctor-column, faq, health-tips, myth, procedures 계열)

### 빌드
- 마지막 확인 빌드: `npm run build` — 통과 예상 (WebVitalsCollector 신규 컴포넌트 추가 후 미확인)

### 알려둘 이슈 / 기술 부채
- `wrangler.toml`의 KV 네임스페이스 ID가 `YOUR_KV_NAMESPACE_ID` 플레이스홀더 상태 → 실제 사용 시 Cloudflare 대시보드에서 ID 발급 후 교체 필요
- i18n 기반(`src/i18n/`)만 추가됨 — 실제 다국어 전환 UI는 미구현
- `src/pages/my/` 회원 페이지 뼈대만 있음 — Supabase Auth 연동 추가 필요
- 모노폴라 RF 시술 안내 페이지는 콘텐츠 완성 상태이나 실제 배포 후 `/procedures/monopolar-rf` URL에서 렌더링 검증 필요

### 다음 작업 아이디어
- 모노폴라 RF 외 미작성 시술 안내 항목 콘텐츠 작성 (마이크로니들 RF, 바디 RF, 집속형 RF 등)
- WebVitals 대시보드 관리자 페이지 추가
- 검색 페이지(`/search`) 벡터 검색 연결 (Supabase `match_posts`)
- i18n 다국어 실제 구현 (EN/KO 전환)
- Poll 투표 컴포넌트 블로그 글에 삽입 테스트

---

## 최근 작업 스냅샷 (갱신일: 2026-04-04)

### 레포 / 브랜치
- **경로**: `c:\dev\s-reborn-clinic`
- **브랜치**: `main` (로컬 기준, 원격과 동기화 여부는 `git status`로 확인)
- **사이트 URL**: `astro.config.mjs` → `site: https://s-reborn-clinic.pages.dev`

### 완료된 작업 요약
- **홈 히어로**: `design.css`의 `.hero-inner` 2열 grid가 홈에 그대로 먹던 문제 수정. `index.astro`에서 `.hero-inner`를 `flex` 세로 스택 + 중앙 정렬로 명시 오버라이드. 제목 `white-space: nowrap` 제거, 부제 `max-width: 560px` 등.
- **모바일 여백**: `--page-inline` + `.site-main` 패딩, 헤더/푸터/탑바 정렬. 페이지별 이중 가로 패딩 제거(procedures, consult, about, legal-doc).
- **블로그**: `pillar` 필드, `llms.txt`/`robots.txt` 엔드포인트, 정적 빌드용 클라이언트 필터·`data-blog-merge` 링크. 글 유형 **MYTH**(자주하는 오해), 메뉴 라벨 FAQ·MYTH·사이드바 `blogCategoryShortcutLabel`.
- **콘텐츠**: `myth/botox-frozen-face-myth.md` 공개 글, `myth/example-myth-starter.md`는 `draft: true` 템플릿.
- **법률 페이지**: `/privacy`, `/terms`, 푸터·상담 동의 링크.
- **GEO/AEO·보안**: JSON-LD(Organization/WebSite/BlogPosting), `public/_headers`(CSP 등), `.well-known/security.txt`, 관리자 `noindex`, 사이트맵에서 `/admin` 제외.
- **기타**: 시술 카탈로그·`procedures.astro`, 네이버 지도 CTA, 상담 스키마/카피 문서(`docs/CONSULT_INTAKE_COPY.md` 등).

### 빌드
- `npm run build` — **통과** (Atkinson 미포함 폰트 참조는 제거됨. Astro 내부 Vite 경고는 업스트림).

### 알려둘 이슈
- 블로그·빌드 관련 정리된 결함 목록: `docs/ERROR_REPORT_BLOG_AND_BUILD.md`.
- 실제 도메인 전환 시 `astro.config` `site`, `security.txt` Canonical, `llms.txt` 등 origin 정합 맞출 것.
- `design.css` `.hero-inner` grid는 **다른 페이지에서 2열 히어로 쓸 때** 클래스 분리(`hero-inner--split` 등) 검토 권장.

### 다음 작업 아이디어
- Academy를 `s-reborn-doctor-ai-academy.pages.dev`로만 두고 클리닉 `/doctor-ai-academy/` 를 걷어낼 때: **`docs/MIGRATION_ACADEMY_EXTERNAL_DOMAIN.md`** (`_redirects` 초안·경로 목록·RSS/sitemap 주의).
- MYTH 후속편(보톡스 “약 안 먹음” 오해) 글 작성.
- 이용약관·개인정보처리방침 법률 검토 반영.
- 상담 폼 `CATEGORIES`에 myth/faq 포함 여부 UX 정리.

---

## 파일 위치 빠른 참고
| 영역 | 경로 |
|------|------|
| 홈 | `src/pages/index.astro` |
| 디자인 토큰·히어로(전역) | `src/styles/design.css` |
| 블로그 목록·필터 스크립트 | `src/pages/blog/index.astro` |
| 글 유형 정의 (`CATEGORIES`) | `src/consts.ts` |
| 블로그 메뉴 헬퍼 | `src/data/blog-nav.ts` |
| 콘텐츠 스키마 | `src/content.config.ts` |
| **Doctor AI Academy 글 작성 규칙** | `docs/DOCTOR_AI_ACADEMY_CONTENT.md` |
| **Academy 전용 도메인 마이그레이션** | `docs/MIGRATION_ACADEMY_EXTERNAL_DOMAIN.md` |
| 구조화 데이터 | `src/lib/structured-data.ts` |
