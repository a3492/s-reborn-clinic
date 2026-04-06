# Doctor AI Academy 글 작성 규칙

아카데미 글은 **일반 블로그와 URL이 다릅니다.** 캐논 URL은 **`/doctor-ai-academy/...`** 이며, `/blog/...`에는 노출되지 않습니다.  
(구 경로 `/doctor-ai/...`, `/blog/doctor-ai/...` 는 `public/_redirects`로 새 URL로 301 됩니다.)

---

## 1. 파일 위치

```
src/content/blog/doctor-ai-academy/{섹션}/{파일베이스}.md
```

| `academy_section` | 폴더 이름     | 예시 경로 |
|-------------------|---------------|-----------|
| `fundamentals`    | `fundamentals` | `doctor-ai-academy/fundamentals/ai-hallucination.md` |
| `prompts`         | `prompts`      | `doctor-ai-academy/prompts/discharge-plan-prompt.md` |
| `cases`           | `cases`        | `doctor-ai-academy/cases/acute-abdominal-pain.md` |
| `tools`           | `tools`        | `doctor-ai-academy/tools/drug-interaction-ai.md` |

- 폴더 이름과 `academy_section` 값을 **반드시 같게** 맞춥니다.
- 빌드 후 글 URL: **`/doctor-ai-academy/{섹션}/{파일베이스}/`**  
  (콘텐츠 `id`는 `doctor-ai-academy/{섹션}/{파일베이스}`이고, 사이트에서는 앞의 `doctor-ai-academy/`를 뗀 경로가 슬러그입니다.)

---

## 2. 필수·권장 frontmatter

스키마는 `src/content.config.ts`에 정의되어 있습니다.

### 반드시 넣을 것

| 필드 | 설명 |
|------|------|
| `title` | 제목 |
| `description` | 요약·검색용 설명 |
| `date` | 발행일 (ISO 문자열 등, 다른 블로그 글과 동일) |
| `category` | **`doctor-ai`** (다른 값이면 `academy_section`을 쓸 수 없음) — **URL 경로와 별개인 카테고리 id** |
| `academy_section` | **`fundamentals` \| `prompts` \| `cases` \| `tools`** 중 하나 |

### 선택

| 필드 | 설명 |
|------|------|
| `academy_order` | 같은 섹션 목록에서 **숫자가 작을수록 앞**에 표시. 없으면 `series_order`·날짜순으로 정렬 |
| `tags`, `thumbnail`, `read_time`, `difficulty`, `type`, `series`, `series_order`, `subcategory` 등 | 기존 블로그와 동일 규칙 |
| `draft` | `true`면 빌드·목록에서 제외 |

### 검증 규칙 (빌드 시)

- `category: doctor-ai` 이면 **`academy_section` 필수**
- `academy_section`이 있으면 **`category`는 반드시 `doctor-ai`**

---

## 3. 관리자(어드민) 미리보기·저장 경로

- **카테고리**가 `doctor-ai`이면, 공개 시 캐논 경로는 **`/doctor-ai-academy/{슬러그}/`** 로 잡힙니다.
- **슬러그**에는 파일과 동일하게 **`섹션/파일베이스`** 형태를 넣습니다.  
  예: `fundamentals/welcome-doctor-ai-academy` → `/doctor-ai-academy/fundamentals/welcome-doctor-ai-academy/`
- 로컬 파일 경로 예: `src/content/blog/doctor-ai-academy/fundamentals/welcome-doctor-ai-academy.md`

---

## 4. 사이트에서의 동작

- **목록**: `/doctor-ai-academy/` 허브, `/doctor-ai-academy/{섹션}/` 섹션 페이지에만 나열
- **메인 블로그** `/blog`: 아카데미 글은 **제외**
- **RSS**: 항목 링크는 아카데미 글은 `/doctor-ai-academy/...`, 그 외는 `/blog/...`
- **구 URL**: `public/_redirects`에서 `/blog/doctor-ai/*`, `/doctor-ai/*` → `/doctor-ai-academy/:splat` (301)

---

## 5. 최소 예시

```yaml
---
title: '글 제목'
description: '한두 문장 요약'
date: 2026-04-04
category: doctor-ai
academy_section: fundamentals
academy_order: 2
tags:
  - AI
draft: false
---

본문…
```

---

## 6. 구현 참고 (코드 위치)

| 역할 | 경로 |
|------|------|
| 공개 경로 상수 | `src/lib/academy-constants.ts` (`ACADEMY_PUBLIC_PATH`, `ACADEMY_CONTENT_ID_PREFIX`) |
| 스키마·검증 | `src/content.config.ts` |
| permalink·필터 | `src/lib/academy.ts` |
| 글 페이지 | `src/pages/doctor-ai-academy/[...slug].astro` |
| 허브·섹션 인덱스 | `src/pages/doctor-ai-academy/index.astro`, `src/pages/doctor-ai-academy/*/index.astro`, `src/components/AcademySectionIndex.astro` |

이 문서를 바꿀 때는 **폴더 규칙·필수 필드·슬러그 형식**이 코드와 어긋나지 않는지 함께 확인합니다.
