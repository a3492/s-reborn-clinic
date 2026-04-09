# PHASE 0 — 사전 파악 (읽기 전용, 실행 없음)

> ✋ 이 파일은 Cursor에게 **실행 전 컨텍스트**를 제공한다. 프롬프트 실행 없음.

---

## 현재 디자인 시스템 구조

| 파일 | 역할 |
|------|------|
| `src/styles/design.css` | 전체 CSS 변수·컴포넌트 스타일 정의 |
| `src/styles/global.css` | 기본 리셋·타이포 |
| `src/pages/index.astro` | 홈페이지 |
| `src/components/` | 공용 컴포넌트 |

---

## 현재 컬러 토큰 (교체 전 원본)

```css
/* 시맨틱 컬러 — 현재 상태 */
--bg:          var(--color-soft-white);   /* #FDFBF8 아이보리 화이트 */
--bg2:         var(--color-cream);        /* #F9F5F0 크림 */
--bg3:         var(--color-blush);        /* #F5EEE8 블러시 */
--surface:     var(--color-white);        /* #FFFFFF */
--accent:      var(--color-gold);         /* #C9A96E 골드 */
--accent-dark: var(--color-gold-deep);   /* #A07840 딥 골드 */
--accent-pink: var(--color-rose);        /* #C97878 로즈 */
```

---

## 목표 디자인 방향

```
Before:  골드·웜브라운 베이스 → 전통적인 고급 클리닉 느낌
After:   핑크 아이보리 베이스 → 여성적·현대적·감성적 클리닉 느낌

S라인:   에스(S)리본의 S + 여성의 실루엣 곡선
         → 배경에 은은한 곡선으로 브랜드 아이덴티티 시각화
```

---

## 주의사항 (Cursor가 반드시 지킬 것)

```
1. 기존 --color-gold, --color-rose 등 원래 토큰 삭제 금지
   → 블로그·시술 페이지에서 여전히 참조 중

2. 인라인 style="" 속성 절대 사용 금지
   → 모든 스타일은 CSS 변수 또는 클래스로

3. 다크모드 html[data-theme="dark"] 블록은 PHASE 6에서 별도로 처리
   → PHASE 1~5 에서는 다크모드 건드리지 않음

4. npm run build 는 PHASE 7에서만 실행
   → 중간 빌드는 Cursor가 임의로 실행하지 않음

5. 변경 후 다른 페이지(blog, procedures 등) 파일 수정 금지
   → 이번 작업 범위는 index.astro + design.css 만
```

---

## ✅ PHASE 0 완료 체크

- [ ] 위 내용을 읽고 프로젝트 구조 파악 완료
- [ ] 다음 단계: **PHASE-1-color-palette.md** 실행
