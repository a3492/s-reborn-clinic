# PHASE 5 — 카드·버튼·뱃지 핑크 톤 정리

> **수정 파일**: `src/styles/design.css`
> **작업 시간**: 약 2분
> **선행 조건**: PHASE 1 완료

---

## 작업 목표

카드 배지, 섹션 킥커, 히어로 킥커, 폼 포커스 등
세부 UI 요소의 컬러를 핑크 아이보리 팔레트로 일관되게 정리한다.

---

## CURSOR 실행 프롬프트

> 아래 전체를 복사해서 Cursor 채팅창에 붙여넣으세요.

```
src/styles/design.css 파일을 수정해줘.
아래 항목들만 정확히 수정하고 다른 코드는 절대 건드리지 마.

─────────────────────────────────────────────
[작업 1] .card-category 배지 컬러 교체
─────────────────────────────────────────────

.card-category 에서:

  background: var(--color-gold-light);
→
  background: var(--color-pink-petal);

  color: var(--color-gold-deep);
→
  color: var(--color-pink-deep);

─────────────────────────────────────────────
[작업 2] .section-kicker 뱃지 컬러 교체
─────────────────────────────────────────────

.section-kicker 에서:

  background: var(--color-pink-light);
→
  background: var(--color-pink-petal);

  color: var(--color-rose);
→
  color: var(--color-pink-mauve);

─────────────────────────────────────────────
[작업 3] .hero-kicker 배지 컬러 교체
─────────────────────────────────────────────

.hero-kicker 에서:

  background: var(--color-gold-light);
→
  background: rgba(238, 196, 207, 0.35);

  color: var(--color-gold-deep);
→
  color: var(--color-pink-deep);

─────────────────────────────────────────────
[작업 4] .card:hover 그림자 톤 교체
─────────────────────────────────────────────

.card:hover 의 box-shadow 가 var(--shadow-lg) 를 쓰고 있으면 그대로 유지.
만약 고정 rgba 값을 쓰고 있으면 핑크 톤으로 교체:
  rgba(42, 36, 32, ...) → rgba(61, 46, 53, ...)

─────────────────────────────────────────────
[작업 5] .post-card-title a:hover 컬러 교체
─────────────────────────────────────────────

.post-card-title a:hover 에서:
  color: var(--accent);
→ 이미 var(--accent) 를 쓰고 있으면 그대로 유지.
   고정 색상을 쓰고 있으면 var(--accent) 로 교체.

─────────────────────────────────────────────
완료 후 확인
─────────────────────────────────────────────

수정 완료 후 아래를 확인하고 보고해줘:
1. .card-category 의 background 가 var(--color-pink-petal) 인가?
2. .section-kicker 의 color 가 var(--color-pink-mauve) 인가?
3. .hero-kicker 의 background 가 rgba(238, 196, 207, 0.35) 인가?
4. 그 외 다른 CSS 규칙은 변경되지 않았는가?
```

---

## ✅ 완료 확인 체크리스트

- [ ] `.card-category` → `background: var(--color-pink-petal)` 적용됨
- [ ] `.section-kicker` → `color: var(--color-pink-mauve)` 적용됨
- [ ] `.hero-kicker` → 핑크 배경 적용됨
- [ ] 그 외 CSS 변경 없음

---

## 다음 단계

➡️ **[PHASE-6-darkmode.md](./PHASE-6-darkmode.md)** 로 이동
