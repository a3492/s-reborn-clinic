# PHASE 6 — 다크모드 핑크 아이보리 대응

> **수정 파일**: `src/styles/design.css`
> **작업 시간**: 약 3분
> **선행 조건**: PHASE 1~5 완료

---

## 작업 목표

라이트모드의 핑크 아이보리 팔레트에 대응하는 다크모드 값을 정의한다.
다크모드는 눈에 부담이 적은 **딥 플럼(deep plum)** 계열로 핑크 아이보리를 재해석한다.

---

## 다크모드 컬러 방향

```
라이트:  #FDF8F2 따뜻한 아이보리 배경
다크:    #1E1A1C 딥 플럼 다크 배경

라이트:  #C97A8E 핑크 모브 액센트
다크:    #C9909E 밝아진 핑크 모브 (어두운 배경 대비)
```

---

## CURSOR 실행 프롬프트

> 아래 전체를 복사해서 Cursor 채팅창에 붙여넣으세요.

```
src/styles/design.css 의 html[data-theme="dark"] 블록을 수정해줘.
기존 다크모드 블록의 내용을 아래로 완전히 교체해줘.
(기존 블록을 찾아서 { } 안의 내용을 아래로 교체하는 것)

html[data-theme="dark"] 블록의 내용을 아래로 교체:

  /* ── 다크모드 핑크 아이보리 팔레트 ── */
  --color-ivory-warm:    #1E1A1C;
  --color-ivory-blush:   #231E21;
  --color-pink-pearl:    #2B2027;
  --color-pink-petal:    #38293200;
  --color-pink-rose:     #6B4452;
  --color-pink-blush:    #9E6E80;
  --color-pink-mauve:    #C9909E;
  --color-pink-deep:     #E0B0BC;
  --color-ivory-text:    #F2E8EC;
  --color-ivory-t2:      #C8B0BC;
  --color-ivory-t3:      #9A8088;
  --color-ivory-rule:    #3F2E36;

  /* 시맨틱 오버라이드 */
  --bg:          #1E1A1C;
  --bg2:         #231E21;
  --bg3:         #2B2027;
  --surface:     #271F24;
  --text:        #F2E8EC;
  --t2:          #C8B0BC;
  --t3:          #9A8088;
  --accent:      #C9909E;
  --accent-dark: #E0B0BC;
  --accent-pink: #B07888;
  --rule:        #3F2E36;

  /* 그림자 다크 조정 */
  --shadow-sm:  0 2px 10px rgba(0, 0, 0, 0.30);
  --shadow-md:  0 8px 24px rgba(0, 0, 0, 0.36);
  --shadow-lg:  0 20px 48px rgba(0, 0, 0, 0.42);
  --shadow-xl:  0 32px 64px rgba(0, 0, 0, 0.48);

그리고 html[data-theme="dark"] 블록 바깥에 아래 별도 규칙들을 추가해줘
(기존에 있던 다크모드 개별 규칙들은 아래로 교체):

html[data-theme="dark"] .site-header {
  background: rgba(30, 26, 28, 0.95);
  border-bottom-color: var(--rule);
}

html[data-theme="dark"] .hero,
html[data-theme="dark"] .hero--pink-ivory {
  background:
    radial-gradient(ellipse at 75% 20%, rgba(180, 100, 120, 0.12), transparent 52%),
    radial-gradient(ellipse at 15% 85%, rgba(150, 80, 100, 0.10), transparent 48%),
    #1E1A1C;
}

html[data-theme="dark"] .hero-image-wrap {
  background: var(--bg3);
  border-color: var(--rule);
}

html[data-theme="dark"] .btn-primary {
  background: linear-gradient(135deg, #C9909E, #A87080);
  box-shadow: 0 6px 18px rgba(180, 110, 130, 0.25);
}

html[data-theme="dark"] .btn-primary:hover {
  box-shadow: 0 12px 28px rgba(180, 110, 130, 0.32);
}

html[data-theme="dark"] .btn-outline {
  border-color: #C9909E;
  color: #E0B0BC;
}

html[data-theme="dark"] .btn-outline:hover {
  background: rgba(201, 144, 158, 0.12);
}

html[data-theme="dark"] .form-input:focus-visible,
html[data-theme="dark"] .form-textarea:focus-visible,
html[data-theme="dark"] .form-select:focus-visible {
  border-color: #C9909E;
  box-shadow: 0 0 0 3px rgba(201, 144, 158, 0.22);
  outline: 2px solid #C9909E;
}

html[data-theme="dark"] .site-footer {
  background: #141012;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

html[data-theme="dark"] .site-footer-top {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

html[data-theme="dark"] .site-footer-link:hover {
  color: #C9909E;
}

─────────────────────────────────────────────
완료 후 확인
─────────────────────────────────────────────

수정 완료 후 아래를 확인하고 보고해줘:
1. html[data-theme="dark"] 블록 안에 --bg: #1E1A1C 가 있는가?
2. html[data-theme="dark"] .hero--pink-ivory 규칙이 있는가?
3. html[data-theme="dark"] .btn-primary 규칙이 있는가?
4. html[data-theme="light"] {} 블록(있다면)은 건드리지 않았는가?
5. :root 블록은 변경하지 않았는가?
```

---

## ✅ 완료 확인 체크리스트

- [ ] `html[data-theme="dark"]` 블록 내 `--bg: #1E1A1C` 있음
- [ ] `html[data-theme="dark"] .hero--pink-ivory` 규칙 있음
- [ ] `html[data-theme="dark"] .btn-primary` 핑크 다크 그라디언트 있음
- [ ] `html[data-theme="dark"] .site-footer` 배경 `#141012` 있음
- [ ] `:root` 블록 변경 없음

---

## 다음 단계

➡️ **[PHASE-7-qa.md](./PHASE-7-qa.md)** 로 이동
