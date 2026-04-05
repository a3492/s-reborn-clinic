export interface ConcernNode {
  id: string;
  label: string;
  children?: ConcernNode[];
}

export const CONCERN_TREE: ConcernNode[] = [
  {
    id: 'skin-texture',
    label: '피부결·모공',
    children: [
      { id: 'pore-size', label: '모공 크기' },
      { id: 'rough-skin', label: '피부 거칠음·각질' },
      { id: 'dull-skin', label: '칙칙함·광택 없음' },
      { id: 'skin-texture-other', label: '기타' },
    ],
  },
  {
    id: 'pigmentation',
    label: '색소·잡티',
    children: [
      { id: 'melasma', label: '기미' },
      { id: 'spots', label: '잡티·검버섯' },
      { id: 'redness', label: '홍조·혈관 확장' },
      { id: 'uneven-tone', label: '칙칙한 피부톤' },
      { id: 'pigmentation-other', label: '기타' },
    ],
  },
  {
    id: 'wrinkles',
    label: '주름·탄력',
    children: [
      { id: 'forehead', label: '이마 주름' },
      { id: 'eye-area', label: '눈가 잔주름' },
      { id: 'nasolabial', label: '팔자·마리오네트' },
      { id: 'neck', label: '목·데콜테 주름' },
      { id: 'sagging', label: '전반적 처짐·리프팅' },
      { id: 'wrinkles-other', label: '기타' },
    ],
  },
  {
    id: 'fat-contour',
    label: '지방·윤곽',
    children: [
      { id: 'face-fat', label: '볼살·얼굴 윤곽' },
      { id: 'double-chin', label: '턱밑·이중턱' },
      {
        id: 'body',
        label: '바디',
        children: [
          {
            id: 'abdomen',
            label: '복부',
            children: [
              { id: 'upper-abdomen', label: '상복부' },
              { id: 'lower-abdomen', label: '하복부' },
              { id: 'flanks', label: '옆구리·허리' },
              { id: 'abdomen-other', label: '기타' },
            ],
          },
          {
            id: 'arms',
            label: '팔',
            children: [
              { id: 'upper-arm', label: '상완 이두·삼두' },
              { id: 'forearm', label: '팔뚝' },
              { id: 'arms-other', label: '기타' },
            ],
          },
          {
            id: 'legs',
            label: '다리',
            children: [
              { id: 'inner-thigh', label: '허벅지 안쪽' },
              { id: 'outer-thigh', label: '허벅지 바깥쪽' },
              { id: 'knee', label: '무릎 위·아래' },
              { id: 'calf', label: '종아리' },
              { id: 'legs-other', label: '기타' },
            ],
          },
          { id: 'back', label: '등·허리' },
          { id: 'body-other', label: '기타' },
        ],
      },
      { id: 'fat-contour-other', label: '기타' },
    ],
  },
  {
    id: 'scar-acne',
    label: '흉터·여드름',
    children: [
      {
        id: 'active-acne',
        label: '활동성 여드름',
        children: [
          { id: 'mild-acne', label: '경증 블랙헤드·화이트헤드' },
          { id: 'moderate-acne', label: '중등도 구진·농포' },
          { id: 'severe-acne', label: '중증 결절·낭종' },
          { id: 'active-acne-other', label: '기타' },
        ],
      },
      {
        id: 'acne-scar',
        label: '여드름 흉터',
        children: [
          { id: 'icepick', label: '아이스픽형' },
          { id: 'boxcar', label: '박스카형' },
          { id: 'rolling', label: '롤링형' },
          { id: 'post-inflammatory', label: '붉은 자국·색소 침착' },
          { id: 'acne-scar-other', label: '기타' },
        ],
      },
      {
        id: 'stretch-marks',
        label: '튼살',
        children: [
          { id: 'stretch-abdomen', label: '복부' },
          { id: 'stretch-thigh-hip', label: '허벅지·엉덩이' },
          { id: 'stretch-chest', label: '가슴' },
          { id: 'stretch-arms', label: '팔' },
          { id: 'stretch-marks-other', label: '기타' },
        ],
      },
      { id: 'keloid', label: '켈로이드·비후성 흉터' },
      { id: 'other-scar', label: '기타 흉터 수술·외상' },
      { id: 'scar-acne-other', label: '기타' },
    ],
  },
  {
    id: 'etc',
    label: '기타',
    children: [
      {
        id: 'hair-loss',
        label: '탈모',
        children: [
          {
            id: 'scalp-hair-loss',
            label: '두피 탈모',
            children: [
              { id: 'male-pattern', label: '남성형 M자·정수리' },
              { id: 'female-pattern', label: '여성형 전반적 숱 감소' },
              { id: 'alopecia-areata', label: '원형 탈모' },
              { id: 'scalp-hair-loss-other', label: '기타' },
            ],
          },
          { id: 'eyebrow-loss', label: '눈썹 탈모' },
          { id: 'hair-loss-other', label: '기타' },
        ],
      },
      { id: 'hyperhidrosis', label: '다한증·체취' },
      {
        id: 'functional-injection',
        label: '기능성 주사',
        children: [
          { id: 'fatigue-immune', label: '피로회복·면역' },
          { id: 'whitening-antioxidant', label: '미백·항산화' },
          { id: 'diet-support', label: '다이어트 보조' },
          { id: 'functional-injection-other', label: '기타' },
        ],
      },
      { id: 'etc-other', label: '기타' },
    ],
  },
];

// ── 헬퍼 함수 ──────────────────────────────────────────────────────

function _findInTree(
  nodes: ConcernNode[],
  id: string,
): ConcernNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = _findInTree(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function _getPathInTree(
  nodes: ConcernNode[],
  id: string,
  current: ConcernNode[] = [],
): ConcernNode[] | null {
  for (const node of nodes) {
    const next = [...current, node];
    if (node.id === id) return next;
    if (node.children) {
      const result = _getPathInTree(node.children, id, next);
      if (result) return result;
    }
  }
  return null;
}

/** id에 해당하는 노드를 찾아 반환합니다. */
export function findNode(id: string): ConcernNode | undefined {
  return _findInTree(CONCERN_TREE, id);
}

/** 루트에서 해당 id 노드까지의 경로 배열을 반환합니다. */
export function getPath(id: string): ConcernNode[] {
  return _getPathInTree(CONCERN_TREE, id) ?? [];
}

/** "지방·윤곽 > 바디 > 복부 > 상복부" 형태의 경로 문자열을 반환합니다. */
export function getPathLabel(id: string): string {
  return getPath(id)
    .map((n) => n.label)
    .join(' > ');
}
