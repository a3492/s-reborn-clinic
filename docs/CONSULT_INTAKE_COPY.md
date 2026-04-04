# 온라인 상담 다단계 인테이크 — 한글 카피 초안

> 스키마: [`consult-intake.schema.json`](./consult-intake.schema.json)  
> 본 문서의 `stepId`·`fieldKey`는 구현 시 그대로 쓰기 좋게 맞춤.

---

## Step 0 — `welcome` (시작 화면)

**제목**  
상담 전에 몇 가지만 여쭙겠습니다

**본문**  
더 맞춤 있는 안내를 드리기 위해, 관심 시술과 간단한 상태를 단계별로 물어봅니다.  
이름과 연락처는 **마지막 단계**에서만 받습니다. (약 2~3분 소요)

**보조**  
이 양식은 진단이나 치료 결정을 대신하지 않습니다. 내원 시 의료진과 최종 상담이 필요합니다.

**버튼**  
[시작하기]

---

## Step 1 — `interest` (관심 영역, 다중 선택)

**제목**  
어떤 부분이 가장 궁금하신가요?

**보조**  
해당되는 항목을 모두 선택해 주세요.

**선택지 (칩)**

| field 값 | 표시 문구 |
|----------|-----------|
| `wrinkle_elasticity` | 주름 · 탄력 |
| `pigment` | 잡티 · 색소 |
| `acne_scar` | 여드름 · 자국 |
| `pore_texture` | 모공 · 피부결 |
| `lifting` | 리프팅 |
| `botox_filler` | 보톡스 · 필러 |
| `hair_removal` | 제모 |
| `body` | 바디 |
| `other` | 기타 |

**기타 선택 시**  
**라벨** 기타 (한 줄로 적어 주세요)  
**placeholder** 예: 이마 보형물 상담, 두피 케어 등

**하단**  
[다음] · [건너뛰기] 비권장 — 최소 1개 선택 권장 문구: “한 가지 이상 선택해 주세요.”

---

## Step 2 — `history` (기간 · 시술 경험)

**제목**  
고민은 얼마나 되셨나요?

**단일 선택**

| field 값 | 표시 문구 |
|----------|-----------|
| `lt_1m` | 1개월 미만 |
| `1_6m` | 1개월 ~ 6개월 |
| `6_12m` | 6개월 ~ 1년 |
| `gt_12m` | 1년 이상 |
| `unsure` | 잘 모르겠어요 |

**제목 2** (같은 스텝 또는 다음 서브스텝)  
해당 부위 시술을 받아본 적이 있나요?

**단일 선택**

| field 값 | 표시 문구 |
|----------|-----------|
| `none` | 없어요 |
| `yes_same_area` | 있어요 (비슷한 부위) |
| `yes_other` | 있어요 (다른 부위) |
| `unsure` | 잘 모르겠어요 |

**조건부 입력**  
`yes_same_area` 또는 `yes_other` 일 때만  
**라벨** 받으신 시술명 (선택, 기억나는 만큼)  
**placeholder** 예: 보톡스, 인모드, 필러 등

**버튼** [다음]

---

## Step 3 — `healthFlags` (건강 · 시술 관련, 예/아니오/잘 모름)

**제목**  
건강 · 최근 시술 관련해 확인할게요

**보조**  
아래는 **진단이 아니라**, 상담 시 의료진이 참고할 수 있는 정보만 모읍니다. 해당 없으면 ‘아니요’를 선택해 주세요.

**문항 공통 선택지**  
[예] [아니요] [잘 모르겠어요] · (선택) [건너뛰기] → 스키마의 `skip`

| key | 질문 문구 |
|-----|-----------|
| `pregnancyPossible` | 임신 가능성이 있거나 수유 중이신가요? |
| `anticoagulantOrSteroid` | 항응고제·특정 스테로이드 등 장기 복용 약이 있나요? |
| `recentProcedure2w` | 최근 2주 안에 다른 시술·레이저·필링 등을 받으셨나요? |
| `keloidTendency` | 상처 후 살이 과하게 올라오는 편(켈로이드 경향)이 있나요? |
| `severeAllergy` | 시술·약물·테이프 등에 심한 알레르기 반응 경험이 있나요? |

**조건부**  
- `severeAllergy` = 예 일 때 **라벨** 알려주실 내용 (선택) · `allergyNote`  
- `anticoagulantOrSteroid` = 예 일 때 **라벨** 약 이름·용도 (선택) · `medicationNote`

**버튼** [다음]

---

## Step 4 — `skinAndLife` (피부 타입 · 생활, 선택)

**제목**  
평소 피부와 생활 패턴을 알려주세요

**보조**  
모르겠다면 ‘잘 모르겠어요’ 또는 건너뛰기를 선택해도 됩니다.

**피부 타입** `skinType`

| 값 | 문구 |
|----|------|
| `dry` | 건성에 가까워요 |
| `oily` | 지성에 가까워요 |
| `combination` | 복합형이에요 |
| `normal` | 특별히 모르겠어요 / 무난한 편이에요 |
| `unsure` | 잘 모르겠어요 |

**자외선·야외** `sunExposure`

| 값 | 문구 |
|----|------|
| `low` | 거의 없어요 |
| `moderate` | 보통이에요 |
| `high` | 많은 편이에요 |
| `unsure` | 잘 모르겠어요 |

**수면·스트레스** `sleepStress`

| 값 | 문구 |
|----|------|
| `low` | 여유 있는 편이에요 |
| `moderate` | 보통이에요 |
| `high` | 부족하거나 높은 편이에요 |
| `unsure` | 잘 모르겠어요 |

**버튼** [다음] [이 항목 건너뛰기] → 전 객체 `skip` 처리 가능 시 스키마 완화 필요 시 별도 이슈

---

## Step 5 — `expectation` (기대 스타일)

**제목**  
원하시는 느낌에 가깝게 골라 주세요

**슬라이더 또는 5칩** `naturalToDramatic`

| 값 | 문구 (툴팁/라벨) |
|----|------------------|
| 1 | 최대한 자연스럽게 |
| 2 | 살짝 달라져도 괜찮아요 |
| 3 | 적당히 눈에 띄게 |
| 4 | 변화가 분명했으면 해요 |
| 5 | 확실한 변화를 원해요 |

**선택** `photoConsultInterest`  
**질문** 사진·영상으로 상담을 받아보실 의향이 있나요? (운영 시에만 표시 권장)

| 값 | 문구 |
|----|------|
| `yes` | 네 |
| `no` | 아니요 |
| `maybe` | 잘 모르겠어요 |
| `skip` | 건너뛰기 |

**버튼** [다음]

---

## Step 6 — `scheduling` (내원 시기 · 연락 가능)

**제목**  
내원·연락 희망을 알려주세요

**내원 시기** `visitWindow`

| 값 | 문구 |
|----|------|
| `this_week` | 이번 주 |
| `two_weeks` | 2주 안 |
| `within_month` | 한 달 안 |
| `undecided` | 아직 미정 |
| `skip` | 건너뛰기 |

**연락 가능 시간대** `contactWindows` (다중)

| 값 | 문구 |
|----|------|
| `morning` | 오전 (9–12시) |
| `lunch` | 점심 전후 |
| `afternoon` | 오후 (12–6시) |
| `evening` | 저녁 (6시 이후) |

**선호 연락 수단** `contactChannel`

| 값 | 문구 |
|----|------|
| `phone` | 전화 |
| `sms` | 문자 |
| `kakao` | 카카오톡 |
| `any` | 상관없어요 |
| `skip` | 건너뛰기 |

**버튼** [다음]

---

## Step 7 — `freeText` (자유 메모)

**제목**  
추가로 알려주실 내용이 있나요?

**보조**  
증상이 심해지는 때, 예전에 받은 시술, 궁금한 브랜드 등 **한두 문장**이면 충분합니다.

**placeholder** 선택 입력 · 최대 500자

**버튼** [다음] [없음 · 건너뛰기]

---

## Step 8 — `contact` (연락처 + 동의) — 스키마상 테이블 컬럼과 병행 가능

**제목**  
연락 받으실 정보를 입력해 주세요

**필드**

- 이름 (필수) → 기존 `consult_requests.name`
- 휴대폰 (필수) → `phone`
- 이메일 (선택) → `email`

**동의** `consents`

**체크박스 1** (필수)  
개인정보 수집·이용에 동의합니다. (수집 항목·목적·보유기간은 하단 링크)

**체크박스 2** (필수)  
본 문의는 의료진의 **진단·치료를 대신하지 않으며**, 정확한 판단은 내원 상담 후 이루어짐을 이해했습니다.

**체크박스 3** (선택)  
이벤트·소식 안내를 받아보겠습니다. (선택 시 `marketingOptional`: true)

**버튼** [상담 신청 완료]

---

## Step 9 — `done` (완료 화면)

**제목**  
접수되었습니다

**본문**  
입력해 주신 내용은 담당자에게 전달됩니다. 영업일 기준 **1~2일 안에** 연락드리겠습니다.

**선택**  
입력 요약 카드 (비식별 위주 필드만 표시)

**버튼** [홈으로] [시술 안내 보기]

---

## 필드 키 ↔ 스키마 요약

| UI 단계 | JSON 최상위 키 |
|---------|----------------|
| 관심 | `interest` |
| 기간·경험 | `history` |
| 건강 플래그 | `healthFlags` |
| 피부·생활 | `skinAndLife` |
| 기대 | `expectation` |
| 일정·연락 | `scheduling` |
| 자유 메모 | `freeText` |
| 동의 | `consents` (+ 이름·전화는 컬럼) |

`stepsSeen` 에는 `welcome`, `interest`, … 문자열을 순서대로 push 권장.

---

## 제출 예시 JSON (최종 1건)

이름·전화 등은 기존 `consult_requests` 컬럼에 두고, 아래는 `intake_json`에 넣는 예시입니다.

```json
{
  "schemaVersion": 1,
  "submittedAt": "2026-04-04T12:34:56.000Z",
  "locale": "ko-KR",
  "stepsSeen": [
    "welcome",
    "interest",
    "history",
    "healthFlags",
    "skinAndLife",
    "expectation",
    "scheduling",
    "freeText",
    "contact"
  ],
  "interest": {
    "areas": ["wrinkle_elasticity", "botox_filler"],
    "otherNote": ""
  },
  "history": {
    "concernDuration": "6_12m",
    "priorProcedure": "yes_same_area",
    "priorProcedureNote": "이마 보톡스 1년 전"
  },
  "healthFlags": {
    "pregnancyPossible": "no",
    "anticoagulantOrSteroid": "no",
    "recentProcedure2w": "no",
    "keloidTendency": "unsure",
    "severeAllergy": "no",
    "allergyNote": "",
    "medicationNote": ""
  },
  "skinAndLife": {
    "skinType": "combination",
    "sunExposure": "moderate",
    "sleepStress": "moderate"
  },
  "expectation": {
    "naturalToDramatic": 2,
    "photoConsultInterest": "maybe"
  },
  "scheduling": {
    "visitWindow": "within_month",
    "contactWindows": ["afternoon", "evening"],
    "contactChannel": "kakao"
  },
  "freeText": "주말 상담 가능 여부만 알고 싶습니다.",
  "consents": {
    "privacy": true,
    "nonDiagnosisDisclaimer": true,
    "marketingOptional": false
  }
}
```

`skinAndLife`·`freeText`·`stepsSeen`·`locale`은 스키마상 필수는 아님(제출 정책에 따라 클라이언트에서 채움).
