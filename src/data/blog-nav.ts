/**
 * 블로그 상단·사이드 메뉴 — 시술 안내 4축(/procedures)과 글 유형(기존 category) 연결
 */
import { CATEGORIES } from '../consts';
import { PROCEDURE_PILLAR_SUMMARIES } from './procedure-catalog';

export type BlogPillarId = (typeof PROCEDURE_PILLAR_SUMMARIES)[number]['id'];

export const BLOG_PILLAR_NAV = PROCEDURE_PILLAR_SUMMARIES.map((p) => ({
  id: p.id,
  label: p.label,
  labelEn: p.labelEn,
  short: p.short,
  shortEn: p.shortEn,
  /** 시술 안내 정적 페이지 앵커 */
  proceduresHref: `/procedures#${p.id}`,
}));

/** 글 유형 바로가기 — consts CATEGORIES와 동일 id·순서 (FAQ·MYTH는 영문 약자 라벨). doctor-ai 글은 Academy 경로로 분리 */
export const BLOG_TYPE_SHORTCUTS = CATEGORIES.filter((c) => c.id !== 'doctor-ai').map((c) => ({
  category: c.id,
  label:
    c.id === 'procedures'
      ? '시술·치료 글'
      : c.id === 'faq'
        ? 'FAQ · 질문'
        : c.id === 'myth'
          ? 'MYTH · 오해'
          : c.label,
  description: c.description,
}));

export function blogPillarLabel(id: string | undefined, locale?: string): string | undefined {
  if (!id) return undefined;
  const p = BLOG_PILLAR_NAV.find((p) => p.id === id);
  if (!p) return undefined;
  return locale === 'en' ? (p.labelEn ?? p.label) : p.label;
}

/** 사이드바·내비 — FAQ/MYTH는 영문 약자 + 한글 힌트 */
export function blogCategoryShortcutLabel(categoryId: string): string {
  if (categoryId === 'doctor-ai') return 'Doctor AI Academy';
  if (categoryId === 'procedures') return '시술·치료 글';
  if (categoryId === 'faq') return 'FAQ · 질문';
  if (categoryId === 'myth') return 'MYTH · 오해';
  const c = CATEGORIES.find((x) => x.id === categoryId);
  return c?.label ?? categoryId;
}
