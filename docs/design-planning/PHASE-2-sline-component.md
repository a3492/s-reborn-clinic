# PHASE 2 — S라인 SVG 배경 컴포넌트 생성

> **수정 파일**: `src/components/SlineBackground.astro` *(신규 생성)*
> **작업 시간**: 약 2분
> **선행 조건**: PHASE 1 완료

---

## 작업 목표

에스리본 클리닉의 브랜드 네임 **'S'** 와 여성의 **곡선미**를 동시에 표현하는
SVG 기반 배경 컴포넌트를 만든다.

- 콘텐츠 아래에 깔려 **은은하게** 보여야 함
- `position: absolute` + `z-index: 0` 으로 배경 레이어 고정
- `variant` prop으로 강도(hero / section / light) 조절 가능
- `flip` prop으로 섹션별 방향 반전 가능
- `prefers-reduced-motion` 대응 필수

---

## CURSOR 실행 프롬프트

> 아래 전체를 복사해서 Cursor 채팅창에 붙여넣으세요.

```
src/components/SlineBackground.astro 파일을 새로 만들어줘.
이미 있으면 아래 내용으로 덮어써줘.
다른 파일은 절대 건드리지 마.

파일 내용은 아래와 같아:

---
interface Props {
  variant?: 'hero' | 'section' | 'light';
  flip?: boolean;
}
const { variant = 'section', flip = false } = Astro.props;
---

<div
  class={`sline-bg sline-bg--${variant}${flip ? ' sline-bg--flip' : ''}`}
  aria-hidden="true"
  role="presentation"
>
  <svg
    class="sline-svg"
    viewBox="0 0 1440 900"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    focusable="false"
  >
    <!-- S자 메인 곡선 — 넓고 부드러운 획 -->
    <path
      class="sline-path sline-path--main"
      d="M -200 800
         C 150 740, 320 640, 500 520
         C 680 400, 740 300, 920 210
         C 1100 120, 1260 70, 1640 40"
      fill="none"
      stroke-width="340"
      stroke-linecap="round"
    />
    <!-- S자 보조 곡선 — 중간 굵기, 오프셋 -->
    <path
      class="sline-path sline-path--sub"
      d="M -200 920
         C 100 840, 280 740, 460 620
         C 640 500, 760 390, 950 300
         C 1140 210, 1300 150, 1640 110"
      fill="none"
      stroke-width="130"
      stroke-linecap="round"
    />
    <!-- S자 세번째 곡선 — 얇고 섬세한 장식선 -->
    <path
      class="sline-path sline-path--thin"
      d="M -200 1020
         C 60 940, 240 840, 430 720
         C 620 600, 780 490, 980 400
         C 1180 310, 1340 240, 1640 190"
      fill="none"
      stroke-width="45"
      stroke-linecap="round"
    />
  </svg>
</div>

<style>
  /* ── 컨테이너 ── */
  .sline-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
    user-select: none;
  }

  .sline-bg--flip .sline-svg {
    transform: scaleX(-1);
  }

  .sline-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* ── hero variant — 가장 선명 ── */
  .sline-bg--hero .sline-path--main {
    stroke: rgba(238, 196, 207, 0.22);
  }
  .sline-bg--hero .sline-path--sub {
    stroke: rgba(247, 224, 230, 0.30);
  }
  .sline-bg--hero .sline-path--thin {
    stroke: rgba(201, 122, 142, 0.13);
  }

  /* ── section variant — 중간 강도 ── */
  .sline-bg--section .sline-path--main {
    stroke: rgba(238, 196, 207, 0.16);
  }
  .sline-bg--section .sline-path--sub {
    stroke: rgba(247, 224, 230, 0.22);
  }
  .sline-bg--section .sline-path--thin {
    stroke: rgba(201, 122, 142, 0.08);
  }

  /* ── light variant — 가장 은은 ── */
  .sline-bg--light .sline-path--main {
    stroke: rgba(238, 196, 207, 0.10);
  }
  .sline-bg--light .sline-path--sub {
    stroke: rgba(247, 224, 230, 0.14);
  }
  .sline-bg--light .sline-path--thin {
    stroke: rgba(201, 122, 142, 0.05);
  }

  /* ── 애니메이션 (hero만, reduced-motion 대응) ── */
  @media (prefers-reduced-motion: no-preference) {
    .sline-bg--hero .sline-path--main {
      animation: sline-breathe 20s ease-in-out infinite alternate;
    }
    .sline-bg--hero .sline-path--sub {
      animation: sline-breathe 26s ease-in-out infinite alternate-reverse;
    }
  }

  @keyframes sline-breathe {
    from { opacity: 0.65; }
    to   { opacity: 1; }
  }

  /* ── 모바일: 가로 스크롤 방지 ── */
  @media (max-width: 768px) {
    .sline-bg {
      overflow: hidden;
      width: 100%;
    }
  }
</style>

파일 생성 후 아래를 확인하고 보고해줘:
1. aria-hidden="true" 속성이 있는가?
2. .sline-bg 에 overflow: hidden 과 z-index: 0 이 있는가?
3. @media (prefers-reduced-motion) 블록이 있는가?
4. 세 가지 variant(hero, section, light) 스타일이 모두 있는가?
```

---

## ✅ 완료 확인 체크리스트

- [ ] `src/components/SlineBackground.astro` 파일 생성됨
- [ ] `aria-hidden="true"` 있음
- [ ] `.sline-bg` 에 `overflow: hidden` + `z-index: 0` 있음
- [ ] `prefers-reduced-motion` 대응 있음
- [ ] `hero`, `section`, `light` 3가지 variant 스타일 있음
- [ ] 다른 기존 파일 수정 없음

---

## 다음 단계

➡️ **[PHASE-3-hero-sline.md](./PHASE-3-hero-sline.md)** 로 이동
