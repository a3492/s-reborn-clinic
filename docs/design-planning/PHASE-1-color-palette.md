# PHASE 1 — 핑크 아이보리 컬러 팔레트 교체

> **수정 파일**: `src/styles/design.css`
> **작업 시간**: 약 3분
> **선행 조건**: PHASE 0 읽기 완료

---

## 작업 목표

골드·브라운 기반의 현재 시맨틱 컬러를 핑크 아이보리 팔레트로 교체한다.
기존 `--color-gold`, `--color-rose` 등의 원시 토큰은 **삭제하지 않는다**.

---

## CURSOR 실행 프롬프트

> 아래 전체를 복사해서 Cursor 채팅창에 붙여넣으세요.

```
src/styles/design.css 파일을 수정해줘.

지시사항을 정확히 따라줘. 지정된 항목 외에는 절대 건드리지 마.

─────────────────────────────────────────────
[작업 1] 새 핑크 아이보리 컬러 토큰 추가
─────────────────────────────────────────────

:root 블록 안의 기존 컬러 팔레트 변수들 바로 아래에
(--color-gray-light 줄 다음에) 아래 주석과 변수를 추가해줘:

  /* ── 핑크 아이보리 테마 팔레트 ── */
  --color-ivory-pure:     #FFFDF9;
  --color-ivory-warm:     #FDF8F2;
  --color-ivory-blush:    #FAF3EF;
  --color-pink-pearl:     #FBF0F3;
  --color-pink-petal:     #F7E0E6;
  --color-pink-rose:      #EEC4CF;
  --color-pink-blush:     #E8A0B0;
  --color-pink-mauve:     #C97A8E;
  --color-pink-deep:      #A85A70;
  --color-ivory-text:     #3D2E35;
  --color-ivory-t2:       #6E5560;
  --color-ivory-t3:       #A08890;
  --color-ivory-rule:     #EDE0E4;

─────────────────────────────────────────────
[작업 2] 시맨틱 컬러 토큰 값 교체
─────────────────────────────────────────────

:root 블록 안의 /* 시맨틱 컬러 */ 섹션에서
아래 변수들의 값을 교체해줘 (변수명은 그대로, 값만 변경):

  --bg:          var(--color-ivory-warm);
  --bg2:         var(--color-ivory-blush);
  --bg3:         var(--color-pink-pearl);
  --surface:     var(--color-ivory-pure);
  --text:        var(--color-ivory-text);
  --t2:          var(--color-ivory-t2);
  --t3:          var(--color-ivory-t3);
  --accent:      var(--color-pink-mauve);
  --accent-dark: var(--color-pink-deep);
  --accent-pink: var(--color-pink-blush);
  --rule:        var(--color-ivory-rule);

─────────────────────────────────────────────
[작업 3] 헤더 배경 교체
─────────────────────────────────────────────

.site-header 의 background 값을:
  rgba(253, 251, 248, 0.92)
→
  rgba(253, 248, 242, 0.94)
로 변경해줘.

─────────────────────────────────────────────
[작업 4] btn-primary 그라디언트·그림자 교체
─────────────────────────────────────────────

.btn-primary 의 background를:
  linear-gradient(135deg, var(--color-gold), var(--color-gold-deep))
→
  linear-gradient(135deg, var(--color-pink-mauve), var(--color-pink-deep))
로 교체.

.btn-primary 의 box-shadow를:
  0 6px 18px rgba(201, 169, 110, 0.35)
→
  0 6px 18px rgba(201, 122, 142, 0.32)
로 교체.

.btn-primary:hover 의 box-shadow를:
  0 12px 28px rgba(201, 169, 110, 0.45)
→
  0 12px 28px rgba(201, 122, 142, 0.42)
로 교체.

─────────────────────────────────────────────
[작업 5] btn-outline 컬러 교체
─────────────────────────────────────────────

.btn-outline 에서:
  border: 2px solid var(--color-gold);
→
  border: 2px solid var(--color-pink-mauve);

  color: var(--color-gold-deep);
→
  color: var(--color-pink-deep);

.btn-outline:hover 에서:
  background: var(--color-gold-light);
→
  background: var(--color-pink-petal);

─────────────────────────────────────────────
[작업 6] 히어로 배경 그라디언트 교체
─────────────────────────────────────────────

.hero 의 background 전체를:
  radial-gradient(circle at 70% 30%, rgba(242, 196, 196, 0.25), transparent 50%),
  radial-gradient(circle at 20% 80%, rgba(201, 169, 110, 0.15), transparent 45%),
  var(--color-soft-white)
→
  radial-gradient(ellipse at 75% 20%, rgba(238, 196, 207, 0.35), transparent 55%),
  radial-gradient(ellipse at 15% 85%, rgba(247, 224, 230, 0.28), transparent 50%),
  radial-gradient(ellipse at 50% 50%, rgba(251, 243, 247, 0.40), transparent 70%),
  var(--color-ivory-warm)
로 교체.

─────────────────────────────────────────────
[작업 7] 로고 마크 그라디언트 교체
─────────────────────────────────────────────

.site-logo-mark 의 background를:
  linear-gradient(135deg, var(--color-gold), var(--color-rose))
→
  linear-gradient(135deg, var(--color-pink-mauve), var(--color-pink-blush))
로 교체.

─────────────────────────────────────────────
[작업 8] focus-visible outline 컬러 전체 교체
─────────────────────────────────────────────

파일 전체에서 아래 문자열을:
  outline: 2px solid var(--color-gold, #c9a96e);
→
  outline: 2px solid var(--color-pink-mauve, #C97A8E);
로 모두 교체 (replace_all).

─────────────────────────────────────────────
[작업 9] form focus-visible box-shadow 교체
─────────────────────────────────────────────

.form-input:focus-visible,
.form-textarea:focus-visible,
.form-select:focus-visible 블록의 box-shadow를:
  0 0 0 3px rgba(201, 169, 110, 0.18)
→
  0 0 0 3px rgba(201, 122, 142, 0.20)
로 교체.

  border-color: var(--color-gold);
→
  border-color: var(--color-pink-mauve);
로 교체.

─────────────────────────────────────────────
완료 후 확인
─────────────────────────────────────────────

수정 완료 후 아래를 확인해줘:
1. :root 에 --color-ivory-warm 변수가 존재하는가?
2. --accent 값이 var(--color-pink-mauve) 인가?
3. --color-gold, --color-rose 원래 토큰이 삭제되지 않고 남아있는가?
4. 다크모드 html[data-theme="dark"] 블록은 건드리지 않았는가?
위 4가지를 간단히 보고해줘.
```

---

## ✅ 완료 확인 체크리스트

- [ ] `--color-ivory-warm` 변수가 `:root`에 추가됨
- [ ] `--accent`가 `var(--color-pink-mauve)`로 교체됨
- [ ] `--color-gold`, `--color-rose` 원본 토큰 **삭제되지 않음** (유지)
- [ ] `html[data-theme="dark"]` 블록 **건드리지 않음**
- [ ] Cursor 완료 보고 확인

---

## 다음 단계

➡️ **[PHASE-2-sline-component.md](./PHASE-2-sline-component.md)** 로 이동
