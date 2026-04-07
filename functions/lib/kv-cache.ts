/**
 * Cloudflare KV 공용 캐시 (공개 집계·설정만; PII·세션 저장 금지).
 * SITE_CACHE 바인딩이 없으면 항상 fetcher만 실행합니다.
 */

export type SiteCacheEnv = {
  SITE_CACHE?: KVNamespace;
};

export async function withCache<T>(
  env: SiteCacheEnv,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const kv = env.SITE_CACHE;
  if (!kv) {
    return fetcher();
  }
  try {
    const cached = await kv.get(key, { type: 'json' });
    if (cached !== null && cached !== undefined) {
      return cached as T;
    }
  } catch {
    /* stale or corrupt → refresh */
  }

  const fresh = await fetcher();
  try {
    await kv.put(key, JSON.stringify(fresh), { expirationTtl: ttl });
  } catch {
    /* write 실패해도 응답은 반환 */
  }
  return fresh;
}

/** 발행 성공 시 목록·설정 캐시 무효화 (바인딩 없으면 no-op) */
export async function invalidatePublishRelatedCaches(env: SiteCacheEnv): Promise<void> {
  const keys = ['settings:all', 'faq:visible', 'views:top5', 'category:counts'] as const;
  for (const key of keys) {
    try {
      await env.SITE_CACHE?.delete(key);
    } catch {
      /* ignore */
    }
  }
}
