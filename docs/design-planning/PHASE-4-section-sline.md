# PHASE 4 — 섹션 배경 S라인 소급 적용

> **수정 파일**: `src/pages/index.astro`
> **작업 시간**: 약 3분
> **선행 조건**: PHASE 2(컴포넌트) + PHASE 3(히어로) 완료

---

## 작업 목표

홈페이지 히어로 아래 주요 섹션들에도 S라인을 은은하게 적용한다.
`section-alt`(교번 배경 섹션)에만 적용하고 흰 배경 섹션은 건드리지 않는다.

---

## CURSOR 실행 프롬프트

> 아래 전체를 복사해서 Cursor 채팅창에 붙여넣으세요.

```
src/pages/index.astro 파일을 수정해줘.
히어로 섹션 아래에 있는 섹션들에 S라인 배경을 추가하는 작업이야.
지정된 규칙대로만 수정하고 다른 코드는 건드리지 마.

─────────────────────────────────────────────
[작업 1] section-alt 에 SlineBackground 삽입 규칙
─────────────────────────────────────────────

index.astro 에서 아래 패턴을 찾아줘:

  <section class="section section-alt">

이 패턴이 여러 개 있을 거야.
각각의 여는 태그 바로 다음 줄에 아래 줄을 추가해줘:

  <SlineBackground variant="section" flip={true} />

단, 히어로 섹션(<section class="hero hero--pink-ivory">)은 건드리지 마.

─────────────────────────────────────────────
[작업 2] section 에 position: relative 보장
─────────────────────────────────────────────

index.astro 의 <style> 블록(PHASE 3에서 추가된 블록)에
아래 CSS를 추가해줘:

  /* ── PHASE 4: 섹션 S라인 레이어 ── */

  /* 모든 section에 stacking context 부여 */
  .section {
    position: relative;
  }

  /* S라인이 콘텐츠 아래로 깔리도록 — section 직계 자식 중 sline-bg 제외 */
  .section > *:not(.sline-bg) {
    position: relative;
    z-index: 1;
  }

  /* section-alt 의 배경을 핑크 아이보리 톤으로 */
  .section-alt {
    background: #FAF3EF;
  }

─────────────────────────────────────────────
완료 후 확인
─────────────────────────────────────────────

수정 완료 후 아래를 확인하고 보고해줘:
1. section-alt 섹션 몇 개에 SlineBackground 가 삽입됐는가? (개수 알려줘)
2. 히어로 섹션에는 추가로 SlineBackground 가 삽입되지 않았는가?
3. .section { position: relative } CSS 가 <style> 블록에 있는가?
4. .section > *:not(.sline-bg) { z-index: 1 } 가 있는가?
```

---

## ✅ 완료 확인 체크리스트

- [ ] `section-alt` 섹션들에 `<SlineBackground variant="section" flip={true} />` 삽입됨
- [ ] 히어로 섹션에는 추가 삽입 없음
- [ ] `.section { position: relative }` CSS 추가됨
- [ ] `.section > *:not(.sline-bg) { z-index: 1 }` 추가됨
- [ ] `.section-alt` 배경색 `#FAF3EF` 적용됨

---

## 다음 단계

➡️ **[PHASE-5-card-button.md](./PHASE-5-card-button.md)** 로 이동
