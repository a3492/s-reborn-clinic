# 오류·결함 보고서 — 블로그 UX 및 빌드 (2026-04)

## 1. 문서 목적

에스리본 클리닉 정적 사이트(`s-reborn-clinic`)에서 확인된 사용자 영향 이슈와 빌드 경고를 정리하고, 적용한 해결책과 검증 결과를 기록합니다.

---

## 2. 요약 표

| ID | 심각도 | 증상 | 원인 | 조치 | 상태 |
|----|--------|------|------|------|------|
| B-01 | P1 | 블로그 키워드 검색 시 시술 영역·유형 사이드 메뉴가 본문과 겹쳐 보임 | 검색 중에도 사이드바·필터가 함께 노출 | `blogSearchFocus`로 검색 중 사이드바 숨김, `.blog-layout--search`로 본문 중앙 정렬 | 해결 |
| B-02 | P0 | 블로그 **포스트** 페이지 모바일에서 사이드바+본문 레이아웃 붕괴 | `BlogPost.astro`에 `display:flex` 등 **인라인 스타일만** 있어 미디어쿼리로 column 전환 불가 | 인라인 제거, `global.css`에 `.blog-post-shell .site-main.blog-with-sidebar` + `max-width:900px`에서 `flex-direction:column` | 해결 |
| B-03 | P0 | 포스트 본문이 `.prose` 위주일 때 타이포가 비어 보일 수 있음 | `.prose`에 `p` 외 규칙이 거의 없음 | `.blog-post-shell .prose` 하위 제목·목록·표·코드 등 스타일 보강 | 해결 |
| B-04 | P1 | 포스트 페이지 사이드바 `js-blog-merge` 링크가 쿼리 병합 없이 고정 `/blog/` | 목록 페이지와 달리 merge 스크립트 미실행 | `BlogPost.astro`에 `mergeBlogHrefFromSearch` + `applyBlogSidebarMergeLinks` 인라인 스크립트 추가 | 해결 |
| B-05 | P1 | 모바일에서 블로그 상단 필터 pill이 뷰포트를 넘침 | 한 줄에 많은 pill, 줄바꿈/스크롤 부족 | `640px` 이하에서 `.blog-menu-pills` 가로 스크롤, pill `flex-shrink` 조정 | 해결 |
| B-06 | P1 | 「필링」MYTH 글이 영역 필터 선택 시 목록에서 사라짐 | 글 frontmatter에 **`pillar` 없음** → `data-pillar=""`로 필터와 불일치 | `peeling-not-filler-myth.md`에 `pillar: topical` 부여, 필러 안내 글에 교차 링크 | 해결 |
| B-07 | P1 | 모바일에서 블로그 글(카드)이 안 보이거나 눌러도 목록이 비어 있음 | 시술 영역 pill 선택 시 **`pillar` 미지정 글 전부 숨김** + 가로 스크롤 중 오탭으로 `?pillar=` 유입 | 필터: `data-pillar`가 비어 있으면 영역 필터와 무관하게 표시. pill 행에 `touch-action: pan-x`, 숨김 empty 블록 `pointer-events` 정리 | 해결 |
| F-01 | P2 | `npm run build` 시 Atkinson woff **미해결** 경고, 런타임 폰트 404 가능 | `public/fonts/`에 파일 없이 `@font-face`·preload만 존재 | Atkinson `@font-face`·preload 제거, 본문 폰트 스택을 Pretendard·system-ui로 정리 | 해결 |

---

## 3. 상세 (참고)

### B-01 ~ B-05

- **관련 파일**: `src/pages/blog/index.astro`, `src/components/Sidebar.astro`, `src/layouts/BlogPost.astro`, `src/styles/global.css`
- **검증**: `/blog/?q=…` 로드 시 사이드바 비표시, 포스트 URL에서 좁은 뷰포트로 flex column 확인, 필터 pill 행 스크롤 확인.

### B-06

- **관련 파일**: `src/content/blog/myth/peeling-not-filler-myth.md`, `src/content/blog/procedures/filler-natural-guide.md`
- **참고**: `pillar=injection`만 켠 목록에는 의도적으로 나오지 않을 수 있음(글 축이 `topical`). 필러 맥락에서는 필러 안내 글의 링크 또는 검색·MYTH 필터 이용.

### F-01

- **관련 파일**: `src/styles/global.css`, `src/components/BaseHead.astro`
- **잔여 경고**: Vite가 `node_modules/astro/...` 내부 미사용 import를 보고할 수 있음 — **업스트림** 이슈로 본 저장소에서 제거 불가.

---

## 4. 회귀 방지 체크리스트

- [ ] `npm run build` 성공
- [ ] `/blog/`, `/blog/?q=테스트`, `/blog/?pillar=topical` 동작
- [ ] 임의 포스트 페이지 모바일 너비(≤900px) 레이아웃
- [ ] 신규 블로그 글: 시술 영역 필터와 맞출 **`pillar`**(또는 의도적 미설정) 명시

---

## 5. 변경 이력 (커밋 참고)

- 검색 포커스·레이아웃: `c0f1539` 전후
- 포스트 레이아웃·prose·merge·pill: `e546f5c`
- 필링 MYTH pillar·필러 링크: `760d1a0`
- 폰트 정리·본 보고서: (현재 작업)
