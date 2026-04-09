# S-Reborn Clinic — Claude Code 프로젝트 인텔리전스

## 프로젝트 개요

에스리본 클리닉(서울)의 공식 웹사이트. Astro 기반 정적 사이트로 Cloudflare Pages에 배포.
주요 타겟: **30~50대 한국 여성**, 비침습적 미용 시술 및 피부 관리에 관심 있는 방문자.

---

## 하네스 팀 구성 (Harness Teams)

> **두 팀을 병렬 운용한다.** 디자인 하네스(6개 역할)와 GEO/AEO 하네스(10개 역할).
> GEO/AEO 상세 규칙 전문: `docs/GEO_AEO_HARNESS.md`

### GEO/AEO 하네스 팀 요약 (AI 엔진 최적화)

| 코드 | 역할 | 시점 |
|------|------|------|
| `[AEO-INTEL]` | AI Query Intelligence — AI 엔진 질문 패턴 분석 | PRE |
| `[AEO-ENTITY]` | Entity & Schema — JSON-LD 구조화 데이터 설계 | PRE+POST |
| `[AEO-EEAT]` | E-E-A-T Credibility — 의학 권위·신뢰성 확보 | PRE+MID |
| `[AEO-ARCH]` | AEO Content Architect — AI 인용 최적 구조 작성 | MID |
| `[AEO-SEM]` | Semantic Density — 시맨틱 밀도·동의어 최적화 | MID |
| `[AEO-MULTI]` | Multimodal GEO — 이미지·영상 메타데이터 최적화 | MID |
| `[AEO-SNIPPET]` | FAQ & Snippet — FAQ 섹션 + FAQPage Schema 삽입 | MID+POST |
| `[AEO-MONITOR]` | AI Visibility Monitor — AI 인용율 추적 | POST |
| `[AEO-CITE]` | Citation Link Builder — 외부 인용·배포 전략 | POST |
| `[AEO-LOOP]` | Optimization Loop — 성과 리뷰·전략 조정 | POST |

**핵심 3가지 규칙 (MID 단계 필수):**
1. **첫 100자 이내** 핵심 답변 직접 서술 (AI 직접 인용 단락)
2. **H2 헤딩** 반드시 질문형 (`"보톡스는 얼마나 지속되나요?"`)
3. **FAQ 섹션** 모든 글 하단에 필수 삽입 + FAQPage JSON-LD 적용

---

## 디자인 하네스 팀 (Design Harness Team)

모든 작업(웹사이트 수정, 콘텐츠 제작)은 아래 6개 에이전트 역할을 순서에 따라 적용한다.

### 팀 구성

| 코드 | 역할 | 주요 임무 |
|------|------|-----------|
| `[전략]` | 전략 디렉터 | 여성 방문자 페르소나, 브랜드 일관성, 경쟁 차별화 |
| `[UX]` | UX 디자이너 | 사용자 동선, 모바일 우선, CTA 배치, 전환율 |
| `[비주얼]` | 비주얼 디자이너 | 컬러·타이포·이미지 가이드 준수, 여성 감성 미학 |
| `[콘텐츠]` | 콘텐츠 디자이너 | 글 구조, 어조, 가독성, 신뢰도 구축 |
| `[SEO]` | SEO 전문가 | 한국 여성 검색어 패턴, 메타데이터, 구조화 데이터 |
| `[QA]` | QA 리뷰어 | 디자인 일관성 검수, 접근성(WCAG AA), 최종 품질 |

---

## 콘텐츠 제작 워크플로우

### BEFORE (제작 전) — 기획 체크리스트

Claude에게 새 글/페이지 작업을 요청하기 전, 반드시 확인:

```
[전략] 이 콘텐츠의 타겟 페르소나는? (연령대, 고민, 검색 의도)
[UX]   어느 페이지/섹션에 배치? 다음 CTA는 무엇?
[콘텐츠] 카테고리: doctor-column | faq | health-tips | before-after | clinic-news
[SEO]  주요 키워드 2~3개 확정 (예: "울쎄라 부작용", "30대 리프팅")
```

### DURING (제작 중) — 실시간 가이드

글 작성 시 자동 적용 규칙:
- **어조**: 전문적이되 따뜻하게. "~합니다" 경어체. 과장 금지.
- **구조**: H2 섹션 3~5개, 각 섹션 200~400자. 리스트 적극 활용.
- **이미지 alt**: 한국어로 구체적으로 (예: "40대 여성 볼 리프팅 시술 전후 비교")
- **내부 링크**: 관련 시술 페이지 또는 FAQ 1~2개 연결
- **디자인 클래스**: `design.css` 변수 사용. 인라인 스타일 금지.

### AFTER (제작 후) — QA 체크리스트

```
[QA] □ 모바일(375px) 레이아웃 깨짐 없음
[QA] □ 이미지 alt 텍스트 전부 작성됨
[QA] □ 제목 태그 H1→H2→H3 순서 올바름
[QA] □ CTA 버튼 색상 = var(--accent) 또는 var(--accent-pink)
[QA] □ 폰트 크기 본문 최소 16px (Pretendard Variable)
[SEO] □ 메타 description 80~120자 한국어
[SEO] □ frontmatter tags에 "작성-YYYYMMDD" 태그 포함
[비주얼] □ 새 색상 추가 시 design.css 변수로만 선언
```

---

## 디자인 시스템 핵심 규칙

### 컬러 팔레트 (여성 감성 기준)
```
주조색:  --color-gold     (#C9A96E) — 신뢰·프리미엄
보조색:  --color-rose     (#C97878) — 따뜻함·케어
배경:    --color-soft-white (#FDFBF8) — 청결·편안함
강조:    --color-pink-light (#FBF0F0) — 부드러움·여성성
```

**절대 사용 금지**: 원색 빨강, 원색 파랑, 형광색. 여성 방문자에게 불안감을 줄 수 있음.

### 타이포그래피
- 폰트: `Pretendard Variable` (가변 폰트, 단일 파일)
- 본문: 16px / line-height 1.6 / color: `--color-charcoal`
- H1: 1.75em, H2: 1.45em (bold), H3: 1.2em (bold)
- 강조 텍스트: `font-weight: 700` (bold만 사용, italic 최소화)

### 이미지 가이드
- **분위기**: 밝고 자연스러운 조명, 클린 배경
- **모델**: 실제적이고 친근한 한국 여성 (과도한 보정 금지)
- **비율**: 블로그 썸네일 16:9, 비포/애프터 1:1
- **포맷**: WebP 우선, 최대 200KB

### 레이아웃
- 콘텐츠 최대 너비: `--content-width: 760px`
- 사이드바: `--sidebar-width: 280px`
- 모바일 우선: 375px 기준으로 설계 후 확장

---

## 여성 방문자 페르소나 (3대 타입)

### 페르소나 A: "신중한 리서처" (35~45세)
- 시술 전 충분한 정보 수집 원함
- 부작용·회복 기간 우선 검색
- **콘텐츠 전략**: 의사 칼럼, 상세 FAQ, 실제 후기

### 페르소나 B: "바쁜 직장인" (28~38세)
- 시간 효율 중시, 빠른 결정
- 가격·소요 시간 바로 보고 싶음
- **콘텐츠 전략**: 핵심 요약 박스, 명확한 CTA, 비포/애프터

### 페르소나 C: "건강 중심 관리자" (40~55세)
- 자연스러운 결과 원함, 과한 시술 거부
- 의사 신뢰도, 클리닉 철학 중시
- **콘텐츠 전략**: 원장 칼럼, 클리닉 소개, 건강 정보

---

## 기술 스택 참고

```
프레임워크: Astro
배포: Cloudflare Pages
CSS: 커스텀 디자인 시스템 (design.css + global.css)
폰트: Pretendard Variable (CDN)
콘텐츠: Markdown (src/content/blog/)
```

## 파일 구조 규칙

- 새 블로그 글: `src/content/blog/{category}/{slug}.md`
- 스타일 변수: `src/styles/design.css` (변수 추가만)
- 컴포넌트: `src/components/` (기존 패턴 유지)
- 절대로 인라인 스타일 `style=""` 사용 금지

---

## 금지 사항 (여성 방문자 신뢰 보호)

1. **과장 문구 금지**: "기적", "완벽", "100% 보장" 등
2. **의료 광고법 준수**: 시술 효과 수치화 시 근거 명시
3. **전후 사진**: 반드시 동의서 확인 후 게시
4. **가격 정보**: 실제 상담가 기준, 허위 최저가 금지
