export const SITE_TITLE = '에스리본 클리닉';
export const SITE_DESCRIPTION = '에스리본 클리닉 공식 블로그 — 시술 안내, 건강 정보, 원장 칼럼';
export const CONTACT_EMAIL = '';
export const KAKAO_CHANNEL_ID = '';

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
