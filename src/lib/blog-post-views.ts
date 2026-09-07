import type { SupabaseClient } from '@supabase/supabase-js';

const STORAGE_PREFIX = 'sreborn_blog_viewed:';

function storageKey(slug: string) {
	return `${STORAGE_PREFIX}${slug}`;
}

/** 1000 이상이면 1.2k 형식 */
export function formatViewCount(n: number): string {
	if (!Number.isFinite(n) || n < 0) return '0';
	const v = Math.floor(n);
	if (v < 1000) return String(v);
	const k = v / 1000;
	if (k < 10) {
		const s = (Math.round(k * 10) / 10).toFixed(1);
		return `${s.replace(/\.0$/, '')}k`;
	}
	return `${Math.round(k)}k`;
}

export function alreadyCountedThisSession(slug: string): boolean {
	if (!slug) return true;
	try {
		return sessionStorage.getItem(storageKey(slug)) === '1';
	} catch {
		return false;
	}
}

export function markCountedThisSession(slug: string) {
	if (!slug) return;
	try {
		sessionStorage.setItem(storageKey(slug), '1');
	} catch {
		/* ignore */
	}
}

export async function fetchViewCountsMap(
	supabase: SupabaseClient,
	slugs: string[]
): Promise<Map<string, number>> {
	const map = new Map<string, number>();
	const unique = [...new Set(slugs.filter(Boolean))];
	if (!unique.length) return map;
	const { data, error } = await supabase
		.from('post_views')
		.select('post_slug, view_count')
		.in('post_slug', unique);
	if (error || !data) return map;
	for (const row of data) {
		map.set(row.post_slug, Number(row.view_count ?? 0));
	}
	return map;
}

/**
 * 세션당 slug 1회만 DB 반영. 반환값은 표시용 최종 view_count.
 *
 * Gate 0 hardened post_views는 browser direct write를 허용하지 않는다.
 * increment_post_view RPC가 유일한 public write path이며, RPC 실패 시에는 현재
 * count만 읽고 임의의 client-side upsert로 우회하지 않는다.
 */
export async function trackBlogPostView(
	supabase: SupabaseClient,
	slug: string
): Promise<number | null> {
	if (!slug) return null;

	if (alreadyCountedThisSession(slug)) {
		const { data, error } = await supabase
			.from('post_views')
			.select('view_count')
			.eq('post_slug', slug)
			.maybeSingle();
		if (error) return null;
		return Number(data?.view_count ?? 0);
	}

	const { data: rpcData, error: rpcError } = await supabase.rpc('increment_post_view', { p_slug: slug });
	if (!rpcError && rpcData !== null && rpcData !== undefined) {
		markCountedThisSession(slug);
		return typeof rpcData === 'number' ? rpcData : Number(rpcData);
	}

	const { data: existing, error: selErr } = await supabase
		.from('post_views')
		.select('view_count')
		.eq('post_slug', slug)
		.maybeSingle();
	if (selErr) return null;
	return Number(existing?.view_count ?? 0);
}
