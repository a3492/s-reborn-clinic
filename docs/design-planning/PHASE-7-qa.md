# PHASE 7 — 최종 QA + 빌드 확인

> **수정 파일**: 없음 (검수만)
> **작업 시간**: 약 5분
> **선행 조건**: PHASE 1~6 전체 완료

---

## 작업 목표

전체 변경사항을 최종 검수하고 빌드 오류가 없는지 확인한다.
문제 발견 시 해당 PHASE로 돌아가 수정한다.

---

## CURSOR 실행 프롬프트 A — 코드 검수

> 아래 전체를 복사해서 Cursor 채팅창에 붙여넣으세요.

```
아래 파일들을 검수하고 문제가 있으면 수정해줘.

검수 대상:
  - src/styles/design.css
  - src/components/SlineBackground.astro
  - src/pages/index.astro

─────────────────────────────────────────────
[검수 1] design.css — 컬러 토큰 일관성
─────────────────────────────────────────────

□ :root 에 --color-ivory-warm ~ --color-ivory-rule 14개 토큰이 있는가?
□ --accent 값이 var(--color-pink-mauve) 인가?
□ --bg 값이 var(--color-ivory-warm) 인가?
□ --color-gold, --color-rose 원본 토큰이 삭제되지 않고 남아있는가?
□ 인라인 HEX 값이 CSS 변수 없이 직접 사용된 곳이 없는가?
  (새로 추가한 코드 기준 — 기존 그림자 rgba 등은 허용)

─────────────────────────────────────────────
[검수 2] SlineBackground.astro — 접근성·성능
─────────────────────────────────────────────

□ aria-hidden="true" 있는가?
□ .sline-bg 에 overflow: hidden 있는가?
□ .sline-bg 에 pointer-events: none 있는가?
□ .sline-bg 에 z-index: 0 있는가?
□ @media (prefers-reduced-motion: no-preference) 블록 있는가?
□ @media (max-width: 768px) 에서 overflow: hidden 있는가?

─────────────────────────────────────────────
[검수 3] index.astro — 레이아웃 안전성
─────────────────────────────────────────────

□ SlineBackground import 가 --- 펜스 블록 안에 있는가?
□ 히어로 섹션이 class="hero hero--pink-ivory" 인가?
□ <SlineBackground variant="hero" /> 가 히어로 <section> 여는 태그 바로 다음에 있는가?
□ .hero--pink-ivory .hero-inner 에 z-index: 1 있는가?
□ .section { position: relative } CSS 있는가?
□ .section > *:not(.sline-bg) { z-index: 1 } 있는가?
□ 인라인 style="" 속성이 새로 추가된 코드에 없는가?

─────────────────────────────────────────────
[검수 4] 모바일 안전성
─────────────────────────────────────────────

□ .sline-bg 에 width: 100% 있는가?
□ .sline-bg 에 max-width 초과로 가로 스크롤 유발 없는가?
□ SVG viewBox 가 "0 0 1440 900" 으로 고정돼 있는가?

─────────────────────────────────────────────
검수 결과 보고 형식
─────────────────────────────────────────────

각 항목을 ✅(통과) / ⚠️(수정 필요) / ❌(오류) 로 보고해줘.
⚠️ 또는 ❌ 항목은 즉시 수정해줘.
```

---

## CURSOR 실행 프롬프트 B — 빌드 실행

> 프롬프트 A 완료 후 아래를 **별도로** 실행하세요.

```
아래 명령어를 실행해줘:

  npm run build

빌드가 성공하면:
  "✅ 빌드 성공 — 오류 없음" 이라고 보고해줘.

빌드가 실패하면:
  오류 메시지 전체를 보여주고,
  원인을 파악해서 수정한 후 다시 빌드를 실행해줘.
  수정한 내용도 알려줘.

빌드 성공 후:
  dist/ 폴더에 index.html 파일이 생성됐는지 확인해줘.
```

---

## CURSOR 실행 프롬프트 C — 변경 요약 보고

> 빌드 성공 확인 후 실행하세요.

```
PHASE 1~6 에서 변경된 내용 전체를 아래 형식으로 요약해줘:

## 변경 파일 요약

### src/styles/design.css
- 추가된 CSS 변수: (개수)개
- 교체된 시맨틱 토큰: (목록)
- 교체된 컴포넌트 스타일: (목록)

### src/components/SlineBackground.astro (신규)
- Props: variant / flip
- Variant 종류: hero / section / light

### src/pages/index.astro
- 히어로 섹션 변경 내용
- 섹션 S라인 적용 개수

## 브라우저 확인 권장 항목
- 히어로 S라인이 콘텐츠 뒤로 깔리는지
- 핑크 아이보리 배경색이 전체 적용됐는지
- 모바일(375px)에서 가로 스크롤 없는지
- 다크모드 전환 시 핑크 다크 팔레트 적용되는지
```

---

## ✅ 전체 완료 체크리스트

### 코드 검수
- [ ] 검수 1 (design.css) — 전 항목 ✅
- [ ] 검수 2 (SlineBackground.astro) — 전 항목 ✅
- [ ] 검수 3 (index.astro) — 전 항목 ✅
- [ ] 검수 4 (모바일 안전성) — 전 항목 ✅

### 빌드
- [ ] `npm run build` 성공 (오류 없음)
- [ ] `dist/index.html` 생성 확인

### 브라우저 확인 (수동)
- [ ] 히어로 섹션 S라인 배경 보임 (은은하게)
- [ ] 전체 배경이 핑크 아이보리 계열
- [ ] 버튼이 핑크 모브 컬러
- [ ] 375px 모바일 가로 스크롤 없음
- [ ] 다크모드 전환 정상

---

## 🎉 전체 리디자인 완료

**PHASE 0~7 완료 시 결과물:**

| 항목 | Before | After |
|------|--------|-------|
| 배경 | 아이보리 화이트 `#FDFBF8` | 핑크 아이보리 `#FDF8F2` |
| 액센트 | 골드 `#C9A96E` | 핑크 모브 `#C97A8E` |
| S라인 배경 | 없음 | SVG 곡선 (3종 강도) |
| 카드 배지 | 골드 라이트 | 핑크 페탈 |
| 다크모드 | 네이비 계열 | 딥 플럼 계열 |
