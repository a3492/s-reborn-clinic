---
name: korean-blog-readability
description: >-
  Applies Korean Markdown/blog prose rules—no mid-word or mid-morpheme line breaks,
  clear paragraphs and sentence boundaries for readability. Use when writing or
  editing Korean blog posts, MD/MDX, clinic or marketing copy, newsletters, or
  when the user asks for readable line breaking, typography, or 가독성 in Korean text.
---

# 한국어 블로그·마크다운 가독성

## 핵심 (항상 준수)

1. **단어·어절 중간에서 줄을 자르지 않는다.**  
   마크다운 소스에서 의미 있는 낱말(예: `보톡스`, `에스리본`, `상담`)이나 조사 앞뒤가 한 줄의 끝과 다음 줄로 갈라지지 않게 쓴다.  
   - ❌ 한 줄 끝이 `보톡` 다음 줄이 `스 시술`  
   - ✅ 한 문장은 한 줄에 쓰거나, **띄어쓰기(어절) 경계·문장 끝**에서만 줄을 바꾼다.

2. **문단 단위로 읽히게 한다.**  
   논리적 덩어리마다 빈 줄로 문단을 나누고, 한 문단은 가능하면 **한 가지 메시지**만 담는다.

3. **과도하게 긴 문장은 나눈다.**  
   쉼표·절 경계에서 끊어 여러 문장으로 나누되, 각 문장도 어절 중간 줄바꿈은 하지 않는다.

4. **목록·제목**  
   - 목록 항목마다 한 줄에 핵심을 모으고, 필요하면 하위 들여쓰기만 사용한다.  
   - 제목(`##`) 바로 아래에는 한 줄 띄우고 본문을 시작한다.

## 마크다운 소스 작성 습관

- 한 문단을 편집기 폭 때문에 여러 “짧은 줄”로 쪼개지 말고, **문단 전체를 연속된 줄**로 두어도 된다(렌더러가 줄 길이를 처리함).  
- 정말 소스에서 줄을 나눌 때는 **문장 끝(마침표 뒤)** 또는 **공백 뒤(다음 어절 시작 전)** 만 사용한다.

## 웹/CSS를 건드릴 때 (참고)

한글 본문이 화면에서 어절 중간에 끊기면 `word-break: break-all` 남용을 의심한다. 본문에는 `word-break: keep-all`(또는 기본값 유지)과 필요 시 `overflow-wrap: break-word` 조합을 우선 고려한다.

## 짧은 체크리스트

- [ ] 소스에 낱말/어절이 두 줄에 걸쳐 깨져 있지 않은가  
- [ ] 문단 사이 빈 줄이 있는가  
- [ ] 한 문장이 지나치게 길지 않은가 (길면 절·문장 단위로 분리)  
- [ ] 제목·목록 구조가 한눈에 들어오는가
