import { ACADEMY_PUBLIC_PATH } from './lib/academy-constants';

export const SITE_TITLE = '에스리본 클리닉';
export const SITE_DESCRIPTION = '에스리본 클리닉 공식 블로그 — 시술 안내, 건강 정보, 원장 칼럼';
export const CONTACT_EMAIL = 'a01034920591@gmail.com';
export const KAKAO_CHANNEL_ID = '_MNGNb';

// 클리닉 기본 정보

export const CLINIC_INFO = {
  name: '에스리본의원',
  nameEn: 'S-Reborn Clinic',
  director: '김도위 대표원장',
  directorEn: 'Dr. Kim Do-wi, Chief Physician',
  phone: '1833-5881',
  address: '서울특별시 마포구 양화로 162, 좋은사람들빌딩 8층',
  addressEn: '162 Yanghwa-ro, Mapo-gu, Seoul · Joeun Saramdeul Bldg. 8F',
  addressDetail: '(동교동, 홍대입구역 8·9번 출구 도보 2~3분)',
  addressDetailEn: '(2–3 min walk from Hongdae Station Exit 8/9)',
  website: 'https://www.s-reborn.com',
  kakaoChannel: 'http://pf.kakao.com/_MNGNb',
  hours: [
    { days: '월·화·수·금', time: '10:30 – 19:30' },
    { days: '목 (야간진료)', time: '13:00 – 21:00' },
    { days: '토', time: '10:00 – 16:00' },
    { days: '일·공휴일', time: '휴무' },
  ],
} as const;

/**
 * 네이버 지도 검색 키워드 — 짧게 유지 (전체 주소·쉼표 포함 긴 문자열은 /p/search 라우팅 오류·빈 화면이 날 수 있음).
 * 상세 주소는 페이지 본문에 표시하고, 지도는 상호 기준 검색으로 연결합니다.
 */
export const NAVER_MAP_SEARCH_QUERY = '에스리본의원';

/** 네이버 지도 웹 검색 (모바일·PC 공통) */
export const NAVER_MAP_SEARCH_URL = `https://map.naver.com/p/search/${encodeURIComponent(NAVER_MAP_SEARCH_QUERY)}`;

export const CATEGORIES = [
  { id: 'procedures',    label: '시술·치료',        labelEn: 'Procedures & Treatments', description: '클리닉 시술 및 치료 안내' },
  { id: 'before-after',  label: '전후 사례',        labelEn: 'Before & After',          description: '시술 전후 비교 사례' },
  { id: 'patient-story', label: '환자 이야기',      labelEn: 'Patient Stories',         description: '환자분들의 실제 경험담' },
  { id: 'health-tips',   label: '건강 정보',        labelEn: 'Health Tips',             description: '일상에서 실천하는 건강 관리 팁' },
  { id: 'clinic-news',   label: '원장·클리닉 소식', labelEn: 'Clinic News',             description: '원장 언론·대외활동, 이벤트, 공지' },
  /** 블로그·필터 메뉴: 영문 약자 라벨 */
  { id: 'faq',           label: 'FAQ',              labelEn: 'FAQ',                     description: 'Frequently Asked Questions — 자주 묻는 질문' },
  { id: 'myth',          label: 'MYTH',             labelEn: 'Myth',                    description: 'Common misconceptions — 자주하는 오해' },
  { id: 'doctor-column', label: '원장 칼럼',        labelEn: "Doctor's Column",         description: '원장의 전문 칼럼' },
  /** 블로그 필터·배지용 — 목록은 Academy 경로로 분리, 사이드바에서는 별도 링크만 노출 */
  { id: 'doctor-ai',     label: 'Doctor AI Academy', labelEn: 'Doctor AI Academy',      description: `의료진용 AI 학습 시리즈 (${ACADEMY_PUBLIC_PATH})` },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

/** trailingSlash: 'always' 와 동일하게 끝 슬래시 유지 (검색·캐논 URL 불일치 방지) */
export const NAV_LINKS = [
  { label: '홈',         href: '/' },
  { label: '시술 안내',  href: '/procedures/' },
  { label: '블로그',     href: '/blog/' },
  { label: '트렌드',     href: '/trending/' },
  { label: 'Doctor AI',  href: `${ACADEMY_PUBLIC_PATH}/` },
  { label: '온라인 상담', href: '/consult/' },
  { label: '소개',       href: '/about/' },
];
