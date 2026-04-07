import { en } from './en';
import { ko } from './ko';

export const translations = { ko, en } as const;

export type Locale = keyof typeof translations;

function resolveDotPath(obj: unknown, keys: string[]): string | undefined {
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === 'string' ? cur : undefined;
}

/** Dot notation: `t(locale, 'nav.blog')`. Missing keys fall back to Korean, then the key string. */
export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  const primary = resolveDotPath(translations[locale], keys);
  if (primary !== undefined) return primary;
  const fallback = resolveDotPath(translations.ko, keys);
  if (fallback !== undefined) return fallback;
  return key;
}
