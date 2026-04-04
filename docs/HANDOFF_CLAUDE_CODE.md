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

## 최근 작업 스냅샷 (갱신일: 2026-04-04)

### 레포 / 브랜치
- **경로**: `c:\dev\s-reborn-clinic`
- **브랜치**: `main` (로컬 기준, 원격과 동기화 여부는 `git status`로 확인)
- **사이트 URL**: `astro.config.mjs` → `site: https://s-reborn-clinic.pages.dev`

### 완료된 작업 요약
- **홈 히어로**: `design.css`의 `.hero-inner` 2열 grid가 홈에 그대로 먹던 문제 수정. `index.astro`에서 `.hero-inner`를 `flex` 세로 스택 + 중앙 정렬로 명시 오버라이드. 제목 `white-space: nowrap` 제거, 부제 `max-width: 560px` 등.
- **모바일 여백**: `--page-inline` + `.site-main` 패딩, 헤더/푸터/탑바 정렬. 페이지별 이중 가로 패딩 제거(procedures, consult, about, legal-doc).
- **블로그**: `pillar` 필드, `llms.txt`/`robots.txt` 엔드포인트, 정적 빌드용 클라이언트 필터·`data-blog-merge` 링크. 카테고리 **MYTH**(자주하는 오해), 메뉴 라벨 FAQ·MYTH·사이드바 `blogCategoryShortcutLabel`.
- **콘텐츠**: `myth/botox-frozen-face-myth.md` 공개 글, `myth/example-myth-starter.md`는 `draft: true` 템플릿.
- **법률 페이지**: `/privacy`, `/terms`, 푸터·상담 동의 링크.
- **GEO/AEO·보안**: JSON-LD(Organization/WebSite/BlogPosting), `public/_headers`(CSP 등), `.well-known/security.txt`, 관리자 `noindex`, 사이트맵에서 `/admin` 제외.
- **기타**: 시술 카탈로그·`procedures.astro`, 네이버 지도 CTA, 상담 스키마/카피 문서(`docs/CONSULT_INTAKE_COPY.md` 등).

### 빌드
- `npm run build` — **통과** (폰트 woff 경고만 있음, 기능 무관).

### 알려둘 이슈
- `@font-face` atkinson woff 빌드 시 미해결 경고.
- 실제 도메인 전환 시 `astro.config` `site`, `security.txt` Canonical, `llms.txt` 등 origin 정합 맞출 것.
- `design.css` `.hero-inner` grid는 **다른 페이지에서 2열 히어로 쓸 때** 클래스 분리(`hero-inner--split` 등) 검토 권장.

### 다음 작업 아이디어
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
| 카테고리 정의 | `src/consts.ts` |
| 블로그 메뉴 헬퍼 | `src/data/blog-nav.ts` |
| 콘텐츠 스키마 | `src/content.config.ts` |
| 구조화 데이터 | `src/lib/structured-data.ts` |
