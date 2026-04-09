# Cursor AI에서 디자인 팀 프롬프트 사용하는 방법

---

## 방법 1 — .cursorrules (자동 적용, 추천)

프로젝트 루트에 `.cursorrules` 파일이 이미 생성되어 있습니다.
Cursor를 열면 자동으로 인식합니다. 추가 설정 불필요.

**확인 방법**: Cursor 우측 하단에 `.cursorrules` 아이콘이 활성화되어 있으면 적용 완료.

---

## 방법 2 — 채팅에서 문서 직접 첨부 (가장 강력)

Cursor 채팅 입력창에서 `@` 를 입력하면 파일 참조 메뉴가 열립니다.

### 작업 유형별 첨부 파일

| 작업 | 첨부할 파일 |
|------|------------|
| 전체 디자인 방향 논의 | `@CURSORRULES_FULL.md` |
| 색상/스타일/코드 작업 | `@DESIGN_SYSTEM.md` |
| 콘텐츠 글쓰기/검토 | `@WORKFLOW.md` |
| UI 텍스트/CTA 작성 | `@FEMALE_PRINCIPLES.md` + `@RESPONSE_RULES.md` |
| 전체 팀 소집 | `@CURSORRULES_FULL.md` + `@DESIGN_SYSTEM.md` |

---

## 방법 3 — 채팅 시작 메시지 복사 (빠른 시작)

아래 메시지를 Cursor 채팅 첫 줄에 붙여넣고 시작:

```
@docs/design-team/CURSORRULES_FULL.md @docs/design-team/DESIGN_SYSTEM.md

위 두 파일을 읽고 S-Reborn 클리닉 디자인 하네스 팀으로 활동해줘.
이후 모든 요청에 팀 역할, 디자인 토큰, 여성 감성 원칙을 적용해줘.
```

---

## 방법 4 — Cursor Rules 설정 (영구 적용)

1. Cursor 메뉴 → `Settings` → `Cursor Rules`
2. `Add Rule` 클릭
3. 아래 내용 붙여넣기:

```
이 프로젝트는 S-Reborn 클리닉 블로그입니다.
docs/design-team/CURSORRULES_FULL.md 를 읽고
항상 여성 감성 디자인 하네스 팀으로 응답하세요.
모든 색상은 docs/design-team/DESIGN_SYSTEM.md 의 CSS 변수를 사용하세요.
```

---

## 상황별 Cursor 채팅 시작 예시

### 새 블로그 글 작성 시
```
@docs/design-team/WORKFLOW.md
[Pre-Production] 새 블로그 포스트 작성 전 체크리스트 주고,
썸네일 가이드와 제목 감성 검토해줘.
주제: 보톡스 후 주의사항
```

### CSS/스타일 코드 작성 시
```
@docs/design-team/DESIGN_SYSTEM.md
블로그 카드 컴포넌트 CSS 작성해줘.
디자인 시스템 토큰 반드시 사용하고,
호버 애니메이션도 포함해줘.
```

### 퍼블리싱 전 검토 시
```
@docs/design-team/WORKFLOW.md @docs/design-team/FEMALE_PRINCIPLES.md
[Post-Production] 아래 블로그 포스트 퍼블리싱 전 최종 검토해줘.
[글 내용 붙여넣기]
```

### 전체 팀 소집 시
```
@docs/design-team/CURSORRULES_FULL.md
S-Reborn 블로그 메인 페이지 디자인 개선안 만들어줘.
여성 방문자 기준으로 가장 아름다운 레이아웃 제안해줘.
```
