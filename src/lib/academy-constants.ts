/** Doctor AI Academy 섹션 id — content 스키마·허브 UI와 공유 */
export const ACADEMY_SECTION_IDS = ['fundamentals', 'prompts', 'cases', 'tools'] as const;
export type AcademySectionId = (typeof ACADEMY_SECTION_IDS)[number];
