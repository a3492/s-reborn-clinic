# Cursor AI 실행 가이드 — 홈페이지 핑크 아이보리 + S라인 리디자인

> 이 파일은 **Cursor AI에게 직접 보여주거나** 각 PHASE 파일을 순서대로 열어서 실행하는 안내서입니다.

---

## Cursor에서 이 작업을 시작하는 방법

### 방법 A — Cursor에 이 파일을 직접 붙여넣기

아래 "전체 실행 지시문"을 Cursor 채팅에 붙여넣으면
Cursor가 전체 흐름을 파악하고 단계별로 물어보며 진행합니다.

```
나는 에스리본 클리닉 홈페이지(Astro 기반)를 핑크 아이보리 + S라인 배경으로 리디자인하려고 해.

작업은 아래 7단계로 나뉘어. 한 단계씩 진행해줘.
각 단계 완료 후 나에게 결과를 보고하고, 내가 "다음" 이라고 말하면 다음 단계로 넘어가줘.
내가 "다시" 라고 하면 해당 단계를 재실행해줘.

작업 규칙:
- 각 단계에서 지정된 파일만 수정한다
- 인라인 style="" 속성 절대 사용 금지
- 기존 --color-gold, --color-rose 토큰 삭제 금지
- npm run build 는 PHASE 7에서만 실행
- 각 단계 완료 후 반드시 결과 요약 보고

─────────────────────────────────────────────
PHASE 1 — src/styles/design.css 핑크 아이보리 컬러 팔레트 교체
─────────────────────────────────────────────

:root 에 아래 14개 핑크 아이보리 토큰 추가:
  --color-ivory-pure: #FFFDF9
  --color-ivory-warm: #FDF8F2
  --color-ivory-blush: #FAF3EF
  --color-pink-pearl: #FBF0F3
  --color-pink-petal: #F7E0E6
  --color-pink-rose: #EEC4CF
  --color-pink-blush: #E8A0B0
  --color-pink-mauve: #C97A8E
  --color-pink-deep: #A85A70
  --color-ivory-text: #3D2E35
  --color-ivory-t2: #6E5560
  --color-ivory-t3: #A08890
  --color-ivory-rule: #EDE0E4

시맨틱 토큰 교체:
  --bg → var(--color-ivory-warm)
  --bg2 → var(--color-ivory-blush)
  --bg3 → var(--color-pink-pearl)
  --surface → var(--color-ivory-pure)
  --text → var(--color-ivory-text)
  --t2 → var(--color-ivory-t2)
  --t3 → var(--color-ivory-t3)
  --accent → var(--color-pink-mauve)
  --accent-dark → var(--color-pink-deep)
  --accent-pink → var(--color-pink-blush)
  --rule → var(--color-ivory-rule)

그 외:
- .site-header background: rgba(253,248,242,0.94)
- .btn-primary: linear-gradient(135deg, var(--color-pink-mauve), var(--color-pink-deep))
- .btn-primary box-shadow: 0 6px 18px rgba(201,122,142,0.32)
- .btn-outline border/color: var(--color-pink-mauve) / var(--color-pink-deep)
- .btn-outline:hover background: var(--color-pink-petal)
- .hero background: 3개 핑크 아이보리 radial-gradient + var(--color-ivory-warm)
- .site-logo-mark: linear-gradient(135deg, var(--color-pink-mauve), var(--color-pink-blush))
- outline 컬러 전체: var(--color-pink-mauve, #C97A8E) (replace_all)
- form focus box-shadow: rgba(201,122,142,0.20)
- html[data-theme="dark"] 블록 건드리지 않음

─────────────────────────────────────────────
PHASE 2 — src/components/SlineBackground.astro 신규 생성
─────────────────────────────────────────────

Props: variant('hero'|'section'|'light', 기본값 'section'), flip(boolean, 기본값 false)

SVG: viewBox="0 0 1440 900", 3개 경로(main 340px, sub 130px, thin 45px 획 굵기)
S자 곡선 경로(main 기준): M -200 800 C 150 740, 320 640, 500 520 C 680 400, 740 300, 920 210 C 1100 120, 1260 70, 1640 40

스타일:
- .sline-bg: position:absolute, inset:0, overflow:hidden, pointer-events:none, z-index:0
- hero variant stroke: main rgba(238,196,207,0.22), sub rgba(247,224,230,0.30), thin rgba(201,122,142,0.13)
- section variant: main 0.16, sub 0.22, thin 0.08
- light variant: main 0.10, sub 0.14, thin 0.05
- prefers-reduced-motion 대응 애니메이션 (hero만)
- flip 시 scaleX(-1)
- aria-hidden="true"

─────────────────────────────────────────────
PHASE 3 — src/pages/index.astro 히어로 S라인 적용
─────────────────────────────────────────────

1. import SlineBackground from '../components/SlineBackground.astro'; 추가
2. <section class="hero"> → <section class="hero hero--pink-ivory">
3. <section class="hero hero--pink-ivory"> 바로 다음 줄에 <SlineBackground variant="hero" /> 추가
4. <style> 블록에 아래 추가:
   - .hero--pink-ivory: position:relative, 3개 radial-gradient + #FDF8F2 배경
   - .hero--pink-ivory .hero-inner: position:relative, z-index:1
   - .hero--pink-ivory .hero-kicker/.hero-badge: 핑크 배경
   - .hero--pink-ivory .hero-title em/strong: color #C97A8E
   - .hero--pink-ivory .hero-image-wrap: background #FAF3EF, border #EEC4CF

─────────────────────────────────────────────
PHASE 4 — src/pages/index.astro 섹션 S라인 적용
─────────────────────────────────────────────

1. <section class="section section-alt"> 여는 태그 바로 다음마다
   <SlineBackground variant="section" flip={true} /> 삽입
2. <style> 블록에 추가:
   - .section { position: relative }
   - .section > *:not(.sline-bg) { position: relative; z-index: 1 }
   - .section-alt { background: #FAF3EF }

─────────────────────────────────────────────
PHASE 5 — src/styles/design.css 카드·뱃지 핑크 톤
─────────────────────────────────────────────

- .card-category: background→var(--color-pink-petal), color→var(--color-pink-deep)
- .section-kicker: background→var(--color-pink-petal), color→var(--color-pink-mauve)
- .hero-kicker: background→rgba(238,196,207,0.35), color→var(--color-pink-deep)

─────────────────────────────────────────────
PHASE 6 — src/styles/design.css 다크모드 핑크 대응
─────────────────────────────────────────────

html[data-theme="dark"] 블록 내용 교체:
  --bg: #1E1A1C, --accent: #C9909E, --text: #F2E8EC 등 핑크 다크 팔레트 전체

개별 규칙 추가:
- html[data-theme="dark"] .hero--pink-ivory: 다크 핑크 배경
- html[data-theme="dark"] .btn-primary: 다크 핑크 그라디언트
- html[data-theme="dark"] .site-footer: background #141012

─────────────────────────────────────────────
PHASE 7 — 최종 QA + 빌드
─────────────────────────────────────────────

검수 후 npm run build 실행. 오류 시 수정 후 재빌드.
빌드 성공 확인 후 전체 변경 요약 보고.

─────────────────────────────────────────────

PHASE 1부터 시작해줘. 완료되면 결과를 보고해줘.
```

---

### 방법 B — PHASE 파일을 하나씩 열어서 실행

각 PHASE 파일을 Cursor에서 열고,
"CURSOR 실행 프롬프트" 코드블록을 복사해서 채팅창에 붙여넣습니다.

```
docs/design-planning/
├── PHASE-0-setup.md          ← 먼저 읽기
├── PHASE-1-color-palette.md  ← 프롬프트 복사 → 실행
├── PHASE-2-sline-component.md
├── PHASE-3-hero-sline.md
├── PHASE-4-section-sline.md
├── PHASE-5-card-button.md
├── PHASE-6-darkmode.md
└── PHASE-7-qa.md             ← 마지막 빌드 확인
```

---

## 각 PHASE 완료 확인 방법

| PHASE | 완료 신호 |
|-------|---------|
| 1 | `--color-ivory-warm` 변수가 design.css에 있음 |
| 2 | `src/components/SlineBackground.astro` 파일 생성됨 |
| 3 | index.astro 히어로가 `class="hero hero--pink-ivory"` |
| 4 | section-alt에 `<SlineBackground>` 삽입됨 |
| 5 | `.card-category`가 `var(--color-pink-petal)` 배경 |
| 6 | `html[data-theme="dark"]` 내 `--bg: #1E1A1C` 있음 |
| 7 | `npm run build` 성공, 오류 없음 |

---

## 문제 발생 시 롤백

```bash
# 특정 파일을 git으로 되돌리기
git checkout HEAD -- src/styles/design.css
git checkout HEAD -- src/pages/index.astro

# 신규 생성 파일 삭제
rm src/components/SlineBackground.astro
```

---

## 연관 문서

| 문서 | 위치 |
|------|------|
| 디자인 시스템 전체 | `src/styles/design.css` |
| 디자인 하네스 팀 규칙 | `docs/design-team/` |
| Cursor 자동 규칙 | `.cursor/rules/` |
| 마스터 인텔리전스 | `CLAUDE.md` |
