export interface ConsultQuestion {
  id: string;
  text: string;
  type: 'single' | 'multi' | 'text';
  options?: string[];
}

export interface ConcernQuestions {
  /** 이 질문 세트를 트리거하는 concern id 목록 */
  concernIds: string[];
  questions: ConsultQuestion[];
}

// ── 고민별 맞춤 질문 ──────────────────────────────────────────────

export const CONSULT_QUESTIONS: ConcernQuestions[] = [
  {
    concernIds: [
      'skin-texture',
      'pore-size',
      'rough-skin',
      'dull-skin',
      'skin-texture-other',
    ],
    questions: [
      {
        id: 'skin-texture-duration',
        text: '언제부터 신경 쓰이셨나요?',
        type: 'single',
        options: ['6개월 미만', '6개월~1년', '1년~3년', '3년 이상', '기타'],
      },
      {
        id: 'skin-texture-prev-treatment',
        text: '이전에 받아보신 시술이 있나요?',
        type: 'multi',
        options: ['없음', '레이저', '피부관리', '기타'],
      },
      {
        id: 'skin-texture-type',
        text: '피부 타입이 어떻게 되시나요?',
        type: 'single',
        options: ['건성', '지성', '복합성', '민감성', '모름'],
      },
    ],
  },
  {
    concernIds: [
      'pigmentation',
      'melasma',
      'spots',
      'redness',
      'uneven-tone',
      'pigmentation-other',
    ],
    questions: [
      {
        id: 'pigmentation-duration',
        text: '잡티가 생긴 기간은?',
        type: 'single',
        options: ['1년 미만', '1~3년', '3~5년', '5년 이상', '모름'],
      },
      {
        id: 'pigmentation-sun',
        text: '햇빛 노출이 많은 편인가요?',
        type: 'single',
        options: ['매우 많음', '보통', '적음', '자외선 차단 항상 함'],
      },
      {
        id: 'pigmentation-pregnancy',
        text: '임신·출산 경험이 있으신가요? (여성 해당)',
        type: 'single',
        options: ['해당 없음', '임신·출산 후 생김', '관계없이 원래 있었음', '잘 모름'],
      },
    ],
  },
  {
    concernIds: [
      'wrinkles',
      'forehead',
      'eye-area',
      'nasolabial',
      'neck',
      'sagging',
      'wrinkles-other',
    ],
    questions: [
      {
        id: 'wrinkles-area',
        text: '가장 신경 쓰이는 부위는?',
        type: 'multi',
        options: ['이마', '눈가', '팔자·마리오네트', '목', '전반적 처짐', '기타'],
      },
      {
        id: 'wrinkles-recovery',
        text: '선호하는 회복 기간은?',
        type: 'single',
        options: ['당일 가능', '3일 이내', '1주일 이내', '상관없음'],
      },
      {
        id: 'wrinkles-prev-lifting',
        text: '이전 리프팅 시술 경험이 있나요?',
        type: 'single',
        options: ['없음', '보툴리눔 톡신', '실 리프팅', 'HIFU/울쎄라', '기타'],
      },
    ],
  },
  {
    concernIds: [
      'fat-contour',
      'face-fat',
      'double-chin',
      'body',
      'abdomen',
      'upper-abdomen',
      'lower-abdomen',
      'flanks',
      'abdomen-other',
      'arms',
      'upper-arm',
      'forearm',
      'arms-other',
      'legs',
      'inner-thigh',
      'outer-thigh',
      'knee',
      'calf',
      'legs-other',
      'back',
      'body-other',
      'fat-contour-other',
    ],
    questions: [
      {
        id: 'fat-weight-change',
        text: '체중 변화가 최근 있었나요?',
        type: 'single',
        options: ['증가 (5kg 이상)', '증가 (5kg 미만)', '변화 없음', '감소', '잘 모름'],
      },
      {
        id: 'fat-exercise',
        text: '운동은 규칙적으로 하시나요?',
        type: 'single',
        options: ['주 3회 이상', '주 1~2회', '가끔', '거의 안 함'],
      },
      {
        id: 'fat-method-pref',
        text: '선호하는 방식은?',
        type: 'single',
        options: ['비수술', '수술도 고려', '상담 후 결정'],
      },
    ],
  },
  {
    concernIds: [
      'scar-acne',
      'active-acne',
      'mild-acne',
      'moderate-acne',
      'severe-acne',
      'active-acne-other',
      'acne-scar',
      'icepick',
      'boxcar',
      'rolling',
      'post-inflammatory',
      'acne-scar-other',
      'stretch-marks',
      'stretch-abdomen',
      'stretch-thigh-hip',
      'stretch-chest',
      'stretch-arms',
      'stretch-marks-other',
      'keloid',
      'other-scar',
      'scar-acne-other',
    ],
    questions: [
      {
        id: 'acne-active',
        text: '여드름이 현재 활동 중인가요?',
        type: 'single',
        options: ['네, 지금도 나고 있어요', '가끔 나는 편', '거의 없어졌어요', '흉터만 남아 있어요'],
      },
      {
        id: 'acne-prev-treatment',
        text: '피부과 치료 경험이 있나요?',
        type: 'multi',
        options: ['없음', '외용 약물', '경구 약물', '레이저 시술', '박피', '기타'],
      },
      {
        id: 'scar-depth',
        text: '흉터 깊이는 어느 정도인가요?',
        type: 'single',
        options: ['얕은 편 (평평함)', '중간 (약간 패임)', '깊은 편 (눈에 띄게 패임)', '혼합형'],
      },
    ],
  },
  {
    concernIds: [
      'hair-loss',
      'scalp-hair-loss',
      'male-pattern',
      'female-pattern',
      'alopecia-areata',
      'scalp-hair-loss-other',
      'eyebrow-loss',
      'hair-loss-other',
    ],
    questions: [
      {
        id: 'hair-loss-family',
        text: '탈모 가족력이 있나요?',
        type: 'single',
        options: ['있음 (부계)', '있음 (모계)', '양쪽 모두', '없음', '모름'],
      },
      {
        id: 'hair-loss-onset',
        text: '탈모 시작 시기는?',
        type: 'single',
        options: ['1년 미만', '1~3년', '3~5년', '5년 이상', '모름'],
      },
      {
        id: 'hair-loss-medication',
        text: '현재 복용 중인 탈모 관련 약이 있나요?',
        type: 'single',
        options: ['없음', '피나스테리드/두타스테리드', '미녹시딜', '기타', '모름'],
      },
    ],
  },
  {
    concernIds: [
      'functional-injection',
      'fatigue-immune',
      'whitening-antioxidant',
      'diet-support',
      'functional-injection-other',
    ],
    questions: [
      {
        id: 'injection-purpose',
        text: '주된 목적이 무엇인가요?',
        type: 'multi',
        options: ['피로 회복', '면역 강화', '미백·피부 광택', '체중 관리', '항산화·노화 예방', '기타'],
      },
      {
        id: 'injection-allergy',
        text: '알레르기 병력이 있나요?',
        type: 'single',
        options: ['없음', '약물 알레르기 있음', '음식 알레르기 있음', '기타', '모름'],
      },
    ],
  },
  {
    concernIds: ['hyperhidrosis'],
    questions: [
      {
        id: 'hyperhidrosis-area',
        text: '주로 어느 부위에 다한증이 있나요?',
        type: 'multi',
        options: ['손바닥', '발바닥', '겨드랑이', '얼굴', '두피', '기타'],
      },
      {
        id: 'hyperhidrosis-severity',
        text: '일상생활에 얼마나 지장을 주나요?',
        type: 'single',
        options: ['매우 심함 (사회생활 지장)', '중간 (신경 쓰이는 수준)', '가벼운 편'],
      },
    ],
  },
];

// ── 공통 질문 (항상 마지막에 표시) ──────────────────────────────────

export const COMMON_QUESTIONS: ConsultQuestion[] = [
  {
    id: 'common-medication',
    text: '현재 복용 중인 약이나 영양제가 있나요?',
    type: 'single',
    options: ['없음', '있음', '모름'],
  },
  {
    id: 'common-pregnancy',
    text: '임신 중이거나 수유 중인가요?',
    type: 'single',
    options: ['해당 없음', '임신 중', '수유 중'],
  },
  {
    id: 'common-contact-method',
    text: '원하시는 상담 방식은?',
    type: 'single',
    options: ['카카오채널 채팅', '전화 상담', '방문 상담'],
  },
  {
    id: 'common-extra',
    text: '추가로 전달하고 싶은 내용이 있으면 자유롭게 적어주세요.',
    type: 'text',
  },
];

/** 선택된 concern id 배열을 받아 관련 질문 목록을 반환합니다 (중복 제거). */
export function getQuestionsForConcerns(
  selectedIds: string[],
): ConsultQuestion[] {
  const seen = new Set<string>();
  const result: ConsultQuestion[] = [];

  for (const cq of CONSULT_QUESTIONS) {
    if (cq.concernIds.some((id) => selectedIds.includes(id))) {
      for (const q of cq.questions) {
        if (!seen.has(q.id)) {
          seen.add(q.id);
          result.push(q);
        }
      }
    }
  }

  // 공통 질문은 항상 추가
  for (const q of COMMON_QUESTIONS) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      result.push(q);
    }
  }

  return result;
}
