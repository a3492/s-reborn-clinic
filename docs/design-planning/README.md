# 에스리본 클리닉 — 디자인 기획 폴더

> **목적**: 홈페이지 핑크 아이보리 + S라인 비주얼 리디자인을 Cursor AI가 단계별로 실행할 수 있도록 프롬프트를 문서화한다.
> **최종 목표**: https://s-reborn-clinic.pages.dev 를 여성 방문자 최적화 핑크 아이보리 테마로 전환

---

## 실행 순서 (Cursor에서 순서대로 진행)

| 순서 | 파일 | 작업 내용 | 수정 대상 |
|------|------|-----------|-----------|
| **PHASE 0** | [`PHASE-0-setup.md`](./PHASE-0-setup.md) | 사전 파악 — 읽기만 함 | 없음 |
| **PHASE 1** | [`PHASE-1-color-palette.md`](./PHASE-1-color-palette.md) | 핑크 아이보리 컬러 팔레트 교체 | `design.css` |
| **PHASE 2** | [`PHASE-2-sline-component.md`](./PHASE-2-sline-component.md) | S라인 SVG 배경 컴포넌트 생성 | `SlineBackground.astro` *(신규)* |
| **PHASE 3** | [`PHASE-3-hero-sline.md`](./PHASE-3-hero-sline.md) | 히어로 섹션 S라인 적용 | `index.astro` |
| **PHASE 4** | [`PHASE-4-section-sline.md`](./PHASE-4-section-sline.md) | 섹션 배경 S라인 소급 적용 | `index.astro` |
| **PHASE 5** | [`PHASE-5-card-button.md`](./PHASE-5-card-button.md) | 카드·버튼·뱃지 핑크 톤 정리 | `design.css` |
| **PHASE 6** | [`PHASE-6-darkmode.md`](./PHASE-6-darkmode.md) | 다크모드 핑크 아이보리 대응 | `design.css` |
| **PHASE 7** | [`PHASE-7-qa.md`](./PHASE-7-qa.md) | 최종 QA + 빌드 확인 | 검수만 |

---

## 핵심 디자인 방향

```
배경:    핑크 아이보리 (#FDF8F2) — 따뜻하고 여성스러운 크림 핑크
액센트:  핑크 모브 (#C97A8E) — 신뢰·프리미엄 핑크
S라인:   은은한 SVG 곡선 배경 — 여성의 곡선미·에스리본 브랜드 연상
어조:    과하지 않게, 자연스럽게, 고급스럽게
```

---

## 파일별 수정 범위 요약

```
src/styles/design.css         ← PHASE 1, 5, 6
src/components/
  └── SlineBackground.astro   ← PHASE 2 (신규 생성)
src/pages/
  └── index.astro             ← PHASE 3, 4
```

---

## Cursor 실행 방법

1. **각 PHASE 파일을 Cursor에서 열기**
2. **"CURSOR 실행 프롬프트" 코드블록 전체 복사**
3. **Cursor 채팅창에 붙여넣고 Enter**
4. **Cursor가 완료하면 `✅ 완료 확인` 항목 체크 후 다음 PHASE 진행**

> ⚠️ 반드시 **순서대로** 실행할 것. PHASE 1(컬러) 없이 PHASE 3(히어로)를 먼저 실행하면 변수 참조 오류 발생.
