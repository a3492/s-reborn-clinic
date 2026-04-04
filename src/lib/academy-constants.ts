/** Doctor AI Academy 섹션 id — content 스키마·허브 UI와 공유 */
export const ACADEMY_SECTION_IDS = ['fundamentals', 'prompts', 'cases', 'tools'] as const;
export type AcademySectionId = (typeof ACADEMY_SECTION_IDS)[number];

/** 공개 사이트 경로 (앞에만 슬래시, 끝 슬래시 없음) */
export const ACADEMY_PUBLIC_PATH = '/doctor-ai-academy';

/**
 * 블로그 컬렉션 entry `id` 접두사 — `src/content/blog/` 아래 폴더명과 반드시 일치
 * 예: doctor-ai-academy/tools/foo.md → id `doctor-ai-academy/tools/foo`
 */
export const ACADEMY_CONTENT_ID_PREFIX = 'doctor-ai-academy/';

/** 구 경로 콘텐츠 id 호환(리다이렉트·구글 북마크) */
export const ACADEMY_LEGACY_CONTENT_PREFIX = 'doctor-ai/';
