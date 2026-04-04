# Doctor AI Academy → 전용 도메인 마이그레이션 실행서

**목표:** `https://s-reborn-doctor-ai-academy.pages.dev`를 Academy **유일한 공개 호스트**로 두고, 클리닉(`s-reborn-clinic.pages.dev`)의 `/doctor-ai-academy/*`·구형 `/doctor-ai/*`·(별도) `s-reborn-blog.pages.dev/doctor-ai/*` 트래픽을 **301으로 넘긴 뒤**, 클리닉 UI·빌드에서 Academy **중복 노출**을 제거한다.

---

## 1. 클리닉 레포에서 “지금 생기는” Academy 관련 목록

### 1.1 빌드되는 URL (정적 라우트)

| 경로 패턴 | 소스 |
|-----------|------|
| `/doctor-ai-academy/` | `src/pages/doctor-ai-academy/index.astro` |
| `/doctor-ai-academy/fundamentals/` | `src/pages/doctor-ai-academy/fundamentals/index.astro` |
| `/doctor-ai-academy/prompts/` | `src/pages/doctor-ai-academy/prompts/index.astro` |
| `/doctor-ai-academy/cases/` | `src/pages/doctor-ai-academy/cases/index.astro` |
| `/doctor-ai-academy/tools/` | `src/pages/doctor-ai-academy/tools/index.astro` |
| `/doctor-ai-academy/{section}/{slug}/` | `src/pages/doctor-ai-academy/[...slug].astro` + `src/content/blog/doctor-ai-academy/**` |

콘텐츠 id 접두사: `doctor-ai-academy/` (`src/lib/academy-constants.ts`).

### 1.2 네비·내부 링크 (외부 도메인으로 바꿀 후보)

| 위치 | 현재 동작 |
|------|-----------|
| `src/consts.ts` → `NAV_LINKS` | `Doctor AI` → `${ACADEMY_PUBLIC_PATH}/` (= `/doctor-ai-academy/`) |
| `src/components/Sidebar.astro` | Academy 허브 → `/doctor-ai-academy/` |
| `src/lib/academy.ts` → `postPermalink` | Academy 글 → `/doctor-ai-academy/.../` |
| `src/pages/rss.xml.ts` | Academy 글 포함, `link`가 위 permalink |
| `@astrojs/sitemap` | Academy URL이 클리닉 도메인으로 포함됨 |
| `src/pages/admin/posts/preview.astro` | doctor-ai 미리보기 경로 `/doctor-ai-academy/...` |
| 일부 `.md` 본문 | 상호 링크 `/doctor-ai-academy/tools/...` |

### 1.3 지금 `public/_redirects` (클리닉 내부 캐논용)

- `/blog/doctor-ai/*` → `/doctor-ai-academy/:splat` (301)
- `/doctor-ai/*` → `/doctor-ai-academy/:splat` (301)
- `/doctor-ai` → `/doctor-ai-academy/` (301)

외부 전용 사이트로 갈 때는 아래 **§4** 블록으로 **교체·보강**한다.

---

## 2. 전용 Academy 사이트 쪽 선행 조건 (반드시 먼저)

1. **경로 정책 결정** (둘 중 하나를 택해 일관되게 유지)

   - **A안 (권장, 리다이렉트 한 줄로 끝):**  
     외부 사이트도 지금과 동일하게 **`/doctor-ai-academy/...`** 를 그대로 둔다.  
     → 클리닉 `_redirects`는 `:splat` 한 번으로 매핑 가능.

   - **B안 (URL 정리):**  
     외부는 **`/fundamentals/...`**, `/tools/...` 처럼 접두사 없음.  
     → 글마다 **구 URL → 신 URL 매핑표** 또는 섹션별 규칙이 필요하고, `_redirects`가 여러 줄로 늘어난다.

2. 외부 프로젝트에 **동일 슬러그**로 글이 배포되는지, 샘플 URL로 **수동 확인** (404 없을 것).

3. 외부 `astro.config` `site`를 **`https://s-reborn-doctor-ai-academy.pages.dev`** 로 설정, sitemap/canonical/OG가 그 origin을 가리키게 할 것.

---

## 3. 실행 순서 (안전한 순서)

| 단계 | 작업 | 비고 |
|------|------|------|
| 1 | 전용 Academy Pages에 배포 완료, 경로 A 또는 B 확정 | 클리닉 손대기 전 |
| 2 | 클리닉 `public/_redirects`에 **§4** 적용 (또는 예시 파일 내용 반영) | 배포 직후 구 북마크·검색 유입 처리 |
| 3 | `NAV_LINKS`·`Sidebar`를 **외부 절대 URL**로 변경 (필요 시 `target="_blank"`) | 클리닉에서 이중 허브 제거 |
| 4 | `postPermalink` / RSS / sitemap 정책 정리 | 아래 §5 |
| 5 | (선택) `src/pages/doctor-ai-academy/*`·관련 컴포넌트·콘텐츠 폴더를 Academy 레포로만 옮기고 클리닉 빌드에서 제거 | 대형 PR, 2~4 이후에 |

---

## 4. 클리닉 `public/_redirects` — 외부 도메인 전환용 초안

**전제:** Academy 외부 사이트가 **같은 경로** `/doctor-ai-academy/*` 를 제공한다 (§2 A안).

아래를 기존 “구 URL → `/doctor-ai-academy/`” **내부** 규칙과 **바꿔 쓰거나**, 외부 전환 직전에 **통합**한다.

```txt
# === Doctor AI Academy → 전용 도메인 (활성화: 외부 사이트 배포·경로 검증 후) ===
# 대상 호스트 (끝 슬래시 없이)
# ACADEMY_ORIGIN=https://s-reborn-doctor-ai-academy.pages.dev

# 클리닉에 남아 있던 캐논 경로 → 외부로 이전
/doctor-ai-academy         https://s-reborn-doctor-ai-academy.pages.dev/doctor-ai-academy/  301
/doctor-ai-academy/*       https://s-reborn-doctor-ai-academy.pages.dev/doctor-ai-academy/:splat  301

# 예전 블로그/짧은 경로 → 외부 동일 슬러그 (중간에 클리닉 /doctor-ai-academy 를 거치지 않음)
/blog/doctor-ai/*          https://s-reborn-doctor-ai-academy.pages.dev/doctor-ai-academy/:splat  301
/doctor-ai                 https://s-reborn-doctor-ai-academy.pages.dev/doctor-ai-academy/  301
/doctor-ai/*               https://s-reborn-doctor-ai-academy.pages.dev/doctor-ai-academy/:splat  301
```

**Cloudflare Pages:** 목적지가 **절대 URL**이면 301 외부 리다이렉트로 동작하는 것이 일반적이다. 배포 후 `/doctor-ai-academy/` 요청이 브라우저에서 외부 호스트로 바뀌는지 **한두 개 URL로 확인**할 것.

**B안(접두사 제거)** 을 쓰는 경우: 위 한 줄 splat 대신 섹션별 규칙을 추가한다. 예:

```txt
/doctor-ai-academy/fundamentals/*  https://s-reborn-doctor-ai-academy.pages.dev/fundamentals/:splat  301
/doctor-ai-academy/tools/*         https://s-reborn-doctor-ai-academy.pages.dev/tools/:splat  301
# … prompts, cases 동일 패턴
/doctor-ai-academy/                https://s-reborn-doctor-ai-academy.pages.dev/  301
```

---

## 5. RSS·사이트맵·permalink 정리 (클리닉)

외부 전환 **후** 클리닉에 Academy **HTML을 더 이상 빌드하지 않을** 계획이면:

- **RSS (`src/pages/rss.xml.ts`):** Academy 글(`isAcademyBlogPost`)을 **제외**하거나, `link`만 `https://s-reborn-doctor-ai-academy.pages.dev/...` 절대 URL로 출력 (중복 발행 방지 정책에 맞게 택일).
- **sitemap:** Academy 경로를 **필터로 제외**하거나 Academy는 외부 sitemap만 사용.
- **`postPermalink`:** 클리닉 사이트 내에서 Academy 카드를 쓰는 페이지(예: 홈 미리보기)가 있으면 **외부 절대 URL** 반환으로 통일.

지금은 Academy가 클리닉 빌드에 포함되므로, **2단계(리다이렉트만)** 까지는 RSS/sitemap을 유지해도 되고, **5단계(페이지 제거)** 와 함께 손보는 것이 실수가 적다.

---

## 6. `s-reborn-blog.pages.dev/doctor-ai/` (별도 프로젝트)

클리닉 `_redirects`는 **클리닉 호스트에만** 적용된다. 구 AI 블로그 도메인은 **그 프로젝트의 `_redirects` 또는 Workers**에서 예를 들어 다음과 같이 둔다.

```txt
/doctor-ai      https://s-reborn-doctor-ai-academy.pages.dev/doctor-ai-academy/  301
/doctor-ai/*    https://s-reborn-doctor-ai-academy.pages.dev/doctor-ai-academy/:splat  301
```

(외부 Academy가 B안이면 여기서도 §4 B안과 동일한 경로로 맞춘다.)

---

## 7. 체크리스트 (배포 전)

- [ ] 외부 Academy에서 허브·섹션·임의 글 3개 URL 직접 열기
- [ ] 클리닉에서 `/doctor-ai-academy/...` 요청 → 301 → 외부 최종 URL 확인
- [ ] Search Console(있다면) 구 URL 제거/주소 변경 요청 일정
- [ ] `llms.txt`·푸터·관리자 미리보기 문구의 Academy URL 일괄 검색 (`doctor-ai-academy` 문자열 grep)

---

## 8. 관련 파일 빠른 grep

```bash
rg "doctor-ai-academy|ACADEMY_PUBLIC_PATH|Doctor AI" src public --glob '!**/node_modules/**'
```

이 문서는 **기획·실행 체크리스트**용이며, `_redirects` 외부 블록은 **외부 사이트가 준비된 뒤** 적용한다.
