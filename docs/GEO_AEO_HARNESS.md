# GEO/AEO 하네스 팀 — S-Reborn Clinic
> Generated: 2026-04-09 | 적용 대상: https://s-reborn-clinic.pages.dev/blog/
> 목적: ChatGPT·Perplexity·Gemini·Claude 등 AI 엔진에서 클리닉 콘텐츠가 인용·노출되도록 최적화

---

## 팀 코드 체계

모든 GEO/AEO 작업에서 아래 코드를 태그로 사용한다.
기존 디자인 하네스(`[전략]` `[UX]` `[비주얼]` `[콘텐츠]` `[SEO]` `[QA]`)와 **병렬 운용**.

| 코드 | 역할명 | 개입 시점 |
|------|--------|-----------|
| `[AEO-INTEL]` | AI Query Intelligence Analyst | PRE |
| `[AEO-ENTITY]` | Entity & Schema Architect | PRE + POST |
| `[AEO-EEAT]` | E-E-A-T Credibility Strategist | PRE + MID |
| `[AEO-ARCH]` | AEO Content Architect | MID |
| `[AEO-SEM]` | Semantic Density Editor | MID |
| `[AEO-MULTI]` | Multimodal GEO Specialist | MID |
| `[AEO-SNIPPET]` | FAQ & Snippet Engineer | MID + POST |
| `[AEO-MONITOR]` | AI Visibility Monitor | POST |
| `[AEO-CITE]` | Citation Link Builder | POST |
| `[AEO-LOOP]` | Continuous Optimization Loop Manager | POST |

---

## PRE-CONTENT: 제작 전 체크리스트

Claude/Cursor에게 새 블로그 글 작업을 요청하기 **전**, 반드시 수행:

```
[AEO-INTEL]  □ Perplexity/ChatGPT/Gemini에서 타깃 주제 직접 검색
              □ AI 응답에 현재 경쟁 클리닉 콘텐츠가 인용되는지 확인
              □ "AI가 답할 예상 질문 TOP 5" 목록 작성 후 글 기획에 반영
              □ 검색 예시 쿼리 패턴: "강남 [시술명]", "[시술명] 부작용", "[시술명] 비용 얼마"

[AEO-ENTITY] □ 해당 시술의 MedicalProcedure Schema 템플릿 준비
              □ 원장·클리닉 Named Entity가 콘텐츠에 일관되게 포함되는지 확인

[AEO-EEAT]   □ 글에 포함할 의학 근거(PubMed 또는 학회 출처) 1개 이상 확보
              □ 원장 김도위 자격증/키닥터 인증 관련성 확인 후 Author 섹션 준비
              □ YMYL 기준: 수치·효과 표현 시 반드시 출처 명시 계획
```

---

## MID-CONTENT: 제작 중 자동 적용 규칙

글 작성 시 **모든 항목 적용 필수**:

### [AEO-ARCH] 콘텐츠 구조 규칙

```
1. 첫 100자 이내: 핵심 답변을 직접 서술 (AI 직접 인용 단락)
   - ❌ "보톡스는 다양한 효과가 있는 시술로..."
   - ✅ "보톡스 효과 지속 기간은 평균 4~6개월이며, 주름 개선율은 임상 연구에서 89%입니다."

2. H2 헤딩 = 사용자 질문형으로 작성
   - ❌ "보톡스 시술 안내"
   - ✅ "보톡스는 얼마나 지속되나요?"

3. H3 헤딩 = 세부 답변 또는 하위 분류

4. 콘텐츠 패턴 (글 유형에 따라 선택):
   - 정의형: "[시술명]이란 무엇인가?"
   - 비교형: "[시술A] vs [시술B] 차이점"
   - 절차형: "[시술명] 시술 과정 단계별"
   - 목록형: "[시술명] 주의사항 5가지"
```

### [AEO-SEM] 시맨틱 밀도 규칙

```
- 핵심 시술 용어는 한국어 + 영문 병기 (첫 등장 시)
  예: "울쎄라(Ultherapy)", "써마지(Thermage)", "시럼파이(Sylfirm X)"
- 동의어·관련어를 자연스럽게 분산 배치 (1개 키워드 반복 금지)
  예: 리프팅 → 리프팅 시술, 피부 탄력, 탄력 개선, 주름 개선
- 숫자·통계·임상 데이터 최소 2개 이상 포함
- 내부 링크: 관련 시술 페이지 또는 기존 FAQ 글 1~2개 연결
```

### [AEO-MULTI] 멀티모달 최적화 규칙

```
- 이미지 alt 텍스트: 한국어 + 의학적 맥락 포함
  ❌ "시술 전후"
  ✅ "40대 여성 볼 리프팅 울쎄라 시술 전후 6주 비교"
- 이미지 파일명: kebab-case + 시술명 포함
  예: ultherapy-cheek-lifting-before-after-6weeks.webp
- 인포그래픽 사용 시: 그래픽 내 텍스트를 본문에도 텍스트로 병기
```

### [AEO-SNIPPET] FAQ 섹션 필수 삽입

모든 블로그 글 하단에 아래 형식으로 FAQ 섹션 추가:

```markdown
## 자주 묻는 질문 (FAQ)

### Q. [시술명]은 얼마나 자주 받아야 하나요?
A. [직접 답변 — 2~4문장, 수치 포함]

### Q. [시술명] 후 일상생활은 언제부터 가능한가요?
A. [직접 답변]

### Q. [시술명]과 [유사 시술]의 차이는 무엇인가요?
A. [직접 답변]
```

**Schema 적용**: FAQ 섹션이 있는 글에는 반드시 `FAQPage` JSON-LD 삽입.

---

## POST-CONTENT: 제작 후 검증 체크리스트

```
[AEO-SNIPPET]  □ Google Rich Results Test 통과 확인
               URL: https://search.google.com/test/rich-results

[AEO-ENTITY]   □ Schema.org JSON-LD 유효성 검사 완료
               □ MedicalProcedure + FAQPage + Article Schema 모두 포함

[AEO-MONITOR]  □ 발행 후 3일 이내: 아래 5개 AI에서 타깃 질문 검색 후 인용 여부 기록
               - ChatGPT (chatgpt.com)
               - Perplexity (perplexity.ai)
               - Google Gemini
               - Claude (claude.ai)
               - Naver AI (Cue:)
               □ 인용 시: 스크린샷 저장 → docs/aeo-citations/ 폴더에 보관
               □ 미인용 시: 스니펫 구조 재조정 → [AEO-ARCH] 규칙 재적용

[AEO-CITE]     □ 해당 글을 외부 채널에 배포 (네이버 블로그, 카카오뷰, 의학 포털)
               □ 배포 URL 기록 → 내부 링크 빌딩 추적
```

---

## Schema 템플릿 — 시술 글 기본 JSON-LD

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalProcedure",
      "name": "{{시술명}}",
      "alternateName": "{{영문 시술명}}",
      "description": "{{시술 설명 1~2문장}}",
      "bodyLocation": "{{시술 부위}}",
      "procedureType": "{{NoninvasiveProcedure | SurgicalProcedure}}",
      "followup": "{{시술 후 관리 방법}}",
      "recognizingAuthority": {
        "@type": "MedicalOrganization",
        "name": "에스리본 클리닉",
        "url": "https://s-reborn-clinic.pages.dev"
      }
    },
    {
      "@type": "Article",
      "headline": "{{글 제목}}",
      "author": {
        "@type": "Physician",
        "name": "김도위",
        "description": "에스리본 클리닉 원장, Thermage·Sylfirm X 키닥터 인증"
      },
      "publisher": {
        "@type": "MedicalOrganization",
        "name": "에스리본 클리닉"
      },
      "datePublished": "{{YYYY-MM-DD}}",
      "medicalAudience": {
        "@type": "MedicalAudience",
        "audienceType": "Patient"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "{{질문1}}",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "{{답변1}}"
          }
        }
      ]
    }
  ]
}
```

---

## AI 노출 KPI 대시보드 (월간 기록)

> 파일 위치: `docs/aeo-kpi-log.md` (매월 업데이트)

| 지표 | 측정 방법 | 목표 |
|------|-----------|------|
| Perplexity 인용율 | 타깃 질문 20개 중 인용 답변 수 | 3개월 후 30%+ |
| Google AI Overview 노출 | 주요 키워드 10개 스크린샷 | 3개월 후 5개+ |
| AI 브랜드 멘션 | "에스리본" 언급 AI 답변 수/월 | 3개월 후 10회+ |
| Featured Snippet 점유 | Search Console 확인 | 3개월 후 15개+ |
| 외부 인용 링크 | 배포 채널별 링크 수 | 3개월 후 50개+ |

---

## 구현 로드맵

### Phase 1 — 기반 구축 (1~2주차)
```
□ 모든 기존 블로그 글에 Article + Physician Schema 삽입
□ 클리닉 홈페이지에 MedicalOrganization + Physician KnowledgeGraph 마크업
□ 원장 Bio 페이지 생성 (E-E-A-T 허브) → /about/director/
□ Google Search Console에서 현재 Featured Snippet 현황 기록 (베이스라인)
```

### Phase 2 — 기존 콘텐츠 AEO 리라이팅 (3~4주차)
```
□ 블로그 글 트래픽 상위 10개 선정
□ 각 글에 [AEO-ARCH] + [AEO-SNIPPET] 규칙 전면 적용
□ FAQ 섹션 + FAQPage Schema 삽입
□ 이미지 alt/파일명 전면 교체
```

### Phase 3 — 모니터링 체계 구축 (2개월차)
```
□ docs/aeo-kpi-log.md 생성 후 베이스라인 수치 기록
□ 주 1회 AI 엔진 5곳 인용 체크 루틴 수립
□ 인용 스크린샷 아카이브 폴더 구성: docs/aeo-citations/YYYY-MM/
```

### Phase 4 — Citation 빌딩 + 멀티모달 (3개월차~)
```
□ 네이버 블로그 / 카카오뷰 / 의학 포털 배포 채널 개설
□ YouTube/숏폼 자막 AEO 최적화 적용
□ 주요 시술 인포그래픽 제작 (텍스트 레이어 포함)
□ 학회 참석/논문 기여 통한 외부 권위 링크 확보
```

---

## 연계 문서

- 디자인 하네스: `CLAUDE.md` (기존 6개 역할과 병렬 운용)
- 기술 스택: Astro + Cloudflare Pages + Markdown (`src/content/blog/`)
- 콘텐츠 경로: `src/content/blog/{category}/{slug}.md`
- KPI 로그: `docs/aeo-kpi-log.md` (자동 생성 예정)
- 인용 아카이브: `docs/aeo-citations/` (자동 생성 예정)
