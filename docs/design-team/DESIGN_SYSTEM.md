# S-Reborn Design System

> 이 파일은 S-Reborn 클리닉 블로그의 공식 디자인 시스템입니다.
> Cursor AI는 이 파일을 코드 작성의 기준으로 삼습니다.

---

## 색상 팔레트 (Color Palette)

```css
:root {
  --color-primary:   #F5EEE6;  /* 크림 화이트 — 피부결 연상, 메인 배경 */
  --color-accent:    #C9A99A;  /* 로즈 베이지 — 따뜻한 신뢰감, 포인트 */
  --color-deep:      #7D5A50;  /* 브라운 테라코타 — 전문성, 헤딩 */
  --color-text:      #2D2D2D;  /* 소프트 블랙 — 눈의 피로 최소화 */
  --color-highlight: #EDD5C5;  /* 피치 글로우 — 강조 배경, 태그 */
  --color-surface:   #FAFAFA;  /* 오프 화이트 — 카드 배경 */
  --color-border:    #EDE0D8;  /* 연한 로즈 — 구분선 */
}
```

### 다크모드
```css
[data-theme="dark"] {
  --color-primary:   #1C1614;
  --color-accent:    #C9A99A;
  --color-deep:      #E8C9BC;
  --color-text:      #F0EAE5;
  --color-highlight: #3D2820;
  --color-surface:   #251E1C;
  --color-border:    #3A2E2A;
}
```

---

## 타이포그래피 (Typography)

```css
/* 폰트 패밀리 */
--font-heading: 'Noto Serif KR', 'Georgia', serif;      /* 세련된 명조 — 고급감 */
--font-body:    'Pretendard', 'Apple SD Gothic Neo', sans-serif; /* 최고 가독성 */
--font-accent:  'Cormorant Garamond', serif;             /* 영문 포인트 — 럭셔리 */

/* 크기 스케일 (8px 그리드) */
--text-xs:   12px;
--text-sm:   14px;
--text-base: 16px;
--text-lg:   20px;
--text-xl:   28px;
--text-2xl:  36px;
--text-3xl:  48px;

/* 행간 & 자간 */
--leading-body:    1.8;     /* 한글 최적 가독성 */
--leading-heading: 1.3;
--tracking-heading: -0.02em;
--tracking-body:    0em;
```

---

## 레이아웃 (Layout)

```css
--max-width:        1200px;   /* 여백을 통한 고급감 */
--max-width-prose:  720px;    /* 본문 최적 읽기 너비 */
--grid-cols-desk:   3;        /* 데스크톱 카드 그리드 */
--grid-cols-mobile: 1;        /* 모바일 */
--gap-card:         24px;
--gap-section:      80px;
--gap-inner:        24px;
--radius-card:      12px;     /* 부드럽고 친근한 모서리 */
--radius-button:    8px;
--image-ratio-thumb: 3/2;     /* 썸네일 비율 */
--image-ratio-hero:  16/9;    /* 히어로 이미지 비율 */
```

---

## 그림자 (Shadow)

```css
--shadow-card:       0 2px 12px rgba(125, 90, 80, 0.08);
--shadow-card-hover: 0 8px 32px rgba(125, 90, 80, 0.16);
--shadow-button:     0 2px 8px rgba(201, 169, 154, 0.30);
```

---

## 애니메이션 (Animation)

```css
/* 카드 호버 */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

/* 페이지 진입 */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: fadeSlideUp 400ms ease-out forwards; }

/* 이미지 로드 */
@keyframes blurClear {
  from { filter: blur(8px); }
  to   { filter: blur(0); }
}
.image-load { animation: blurClear 300ms ease-out forwards; }

/* 스크롤 진행 바 색상 */
--progress-bar-color: var(--color-accent);
```

---

## 컴포넌트 토큰 요약

| 컴포넌트 | 배경 | 텍스트 | 테두리 | 모서리 |
|---------|------|--------|--------|--------|
| 카드 | `--color-surface` | `--color-text` | `--color-border` | `--radius-card` |
| 태그 | `--color-highlight` | `--color-deep` | none | 999px |
| 버튼(주) | `--color-accent` | white | none | `--radius-button` |
| 버튼(보조) | transparent | `--color-deep` | `--color-border` | `--radius-button` |
| 인용구 | `--color-highlight` | `--color-deep` | left: `--color-accent` | 4px |
