# PHASE 3 — 히어로 섹션 S라인 적용

> **수정 파일**: `src/pages/index.astro`
> **작업 시간**: 약 3분
> **선행 조건**: PHASE 1(컬러) + PHASE 2(컴포넌트) 완료

---

## 작업 목표

홈페이지 히어로 섹션에 S라인 배경과 핑크 아이보리 오버레이를 적용한다.
콘텐츠(텍스트, 버튼)는 항상 S라인 위로 떠 있어야 한다.

---

## CURSOR 실행 프롬프트

> 아래 전체를 복사해서 Cursor 채팅창에 붙여넣으세요.

```
src/pages/index.astro 파일을 수정해줘.
지정된 3가지 작업만 정확히 수행해. 다른 코드는 절대 건드리지 마.

─────────────────────────────────────────────
[작업 1] import 추가
─────────────────────────────────────────────

파일 상단 --- 펜스 블록 안의 import 목록 맨 마지막 줄 바로 아래에
다음 한 줄을 추가해줘:

  import SlineBackground from '../components/SlineBackground.astro';

이미 있으면 추가하지 마.

─────────────────────────────────────────────
[작업 2] 히어로 섹션 class 교체 + 컴포넌트 삽입
─────────────────────────────────────────────

index.astro 에서 히어로 섹션을 찾아줘.
히어로 섹션은 아래 패턴 중 하나로 시작해:

  <section class="hero">
  또는
  <section class="hero ...">

이 여는 태그를 아래로 교체해줘:
  <section class="hero hero--pink-ivory">

그리고 교체된 <section class="hero hero--pink-ivory"> 태그 바로 다음 줄에
아래 한 줄을 추가해줘:

  <SlineBackground variant="hero" />

─────────────────────────────────────────────
[작업 3] index.astro 에 <style> 블록 추가
─────────────────────────────────────────────

index.astro 파일 맨 하단에 아래 <style> 블록을 추가해줘.
이미 <style> 블록이 있으면 기존 블록 안에 아래 내용을 추가해줘.

<style>
  /* ── PHASE 3: 히어로 핑크 아이보리 오버레이 ── */

  .hero--pink-ivory {
    position: relative;
    background:
      radial-gradient(ellipse at 75% 15%, rgba(238, 196, 207, 0.30), transparent 55%),
      radial-gradient(ellipse at 10% 90%, rgba(247, 224, 230, 0.25), transparent 50%),
      #FDF8F2;
  }

  /* S라인이 콘텐츠 아래로 깔리도록 */
  .hero--pink-ivory .hero-inner {
    position: relative;
    z-index: 1;
  }

  /* 히어로 배지(kicker) 핑크 아이보리 */
  .hero--pink-ivory .hero-kicker,
  .hero--pink-ivory .hero-badge {
    background: rgba(238, 196, 207, 0.35);
    color: #A85A70;
    border: 1px solid rgba(201, 122, 142, 0.25);
  }

  /* 히어로 타이틀 em·strong 핑크 강조 */
  .hero--pink-ivory .hero-title em,
  .hero--pink-ivory .hero-title strong {
    color: #C97A8E;
    font-style: normal;
  }

  /* 히어로 이미지 영역 배경 */
  .hero--pink-ivory .hero-image-wrap {
    background: #FAF3EF;
    border: 1px solid #EEC4CF;
  }
</style>

─────────────────────────────────────────────
완료 후 확인
─────────────────────────────────────────────

수정 완료 후 아래를 확인하고 보고해줘:
1. SlineBackground import 줄이 --- 블록 안에 있는가?
2. 히어로 섹션이 class="hero hero--pink-ivory" 로 시작하는가?
3. <SlineBackground variant="hero" /> 가 <section> 바로 아래에 있는가?
4. .hero--pink-ivory .hero-inner 에 z-index: 1 이 있는가?
5. 다른 섹션·컴포넌트·import 는 건드리지 않았는가?
```

---

## ✅ 완료 확인 체크리스트

- [ ] `SlineBackground` import 추가됨 (--- 블록 안)
- [ ] 히어로 섹션 `class="hero hero--pink-ivory"` 적용됨
- [ ] `<SlineBackground variant="hero" />` 삽입됨
- [ ] `.hero--pink-ivory .hero-inner` 에 `z-index: 1` 있음
- [ ] `<style>` 블록 추가됨
- [ ] 나머지 섹션·파일 변경 없음

---

## 다음 단계

➡️ **[PHASE-4-section-sline.md](./PHASE-4-section-sline.md)** 로 이동
