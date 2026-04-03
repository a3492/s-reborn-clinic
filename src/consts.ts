export const SITE_TITLE = '에스리본 클리닉';
export const SITE_DESCRIPTION = '에스리본 클리닉 공식 블로그 — 시술 안내, 건강 정보, 원장 칼럼';
export const CONTACT_EMAIL = 'a01034920591@gmail.com';
export const KAKAO_CHANNEL_ID = '_MNGNb';

// 클리닉 기본 정보
export const CLINIC_INFO = {
  name: '에스리본의원',
  director: '김도위 대표원장',
  phone: '1833-5881',
  address: '서울특별시 마포구 양화로 162, 좋은사람들빌딩 8층',
  addressDetail: '(동교동, 홍대입구역 8·9번 출구 도보 2~3분)',
  website: 'https://www.s-reborn.com',
  kakaoChannel: 'http://pf.kakao.com/_MNGNb',
  hours: [
    { days: '월·화·수·금', time: '10:30 – 19:30' },
    { days: '목 (야간진료)', time: '13:00 – 21:00' },
    { days: '토', time: '10:00 – 16:00' },
    { days: '일·공휴일', time: '휴무' },
  ],
} as const;

/** 네이버 지도 웹에서 장소 검색으로 여는 URL. 지도 앱 전체 URL을 iframe에 넣으면 차단·깨짐이 잦아 링크만 사용합니다. */
export const NAVER_MAP_SEARCH_URL = `https://map.naver.com/p/search/${encodeURIComponent(
  `${CLINIC_INFO.name} ${CLINIC_INFO.address}`,
)}`;

export const CATEGORIES = [
  { id: 'procedures',    label: '시술·치료',   description: '클리닉 시술 및 치료 안내' },
  { id: 'before-after',  label: '전후 사례',   description: '시술 전후 비교 사례' },
  { id: 'patient-story', label: '환자 이야기', description: '환자분들의 실제 경험담' },
  { id: 'health-tips',   label: '건강 정보',   description: '일상에서 실천하는 건강 관리 팁' },
  { id: 'clinic-news',   label: '클리닉 소식', description: '이벤트, 공지 및 클리닉 뉴스' },
  { id: 'faq',           label: 'FAQ',         description: '자주 묻는 질문' },
  { id: 'doctor-column', label: '원장 칼럼',   description: '원장의 전문 칼럼' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export const NAV_LINKS = [
  { label: '홈',         href: '/' },
  { label: '시술 안내',  href: '/procedures' },
  { label: '블로그',     href: '/blog' },
  { label: '온라인 상담', href: '/consult' },
  { label: '소개',       href: '/about' },
];
