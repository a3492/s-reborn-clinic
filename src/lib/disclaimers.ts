/**
 * 공개 블로그용 면책 고지 — anon RLS 로 활성 행만 조회 (site-settings 패턴과 동일).
 */

async function fetchDisclaimerBody(
	supabaseUrl: string,
	supabaseKey: string,
	categoryKey: string,
): Promise<string | null> {
	const q = `${supabaseUrl}/rest/v1/disclaimers?select=body&category=eq.${encodeURIComponent(categoryKey)}&is_active=eq.true&limit=1`;
	const res = await fetch(q, {
		headers: {
			apikey: supabaseKey,
			Authorization: `Bearer ${supabaseKey}`,
		},
	});

	if (!res.ok) return null;
	const rows = (await res.json()) as { body?: string }[];
	const body = rows[0]?.body;
	return typeof body === 'string' && body.trim() ? body.trim() : null;
}

/**
 * 글 카테고리에 맞는 활성 면책 본문.
 * - 먼저 post.category 그대로 조회
 * - doctor-ai → `ai` 키 추가 시도
 * - 없으면 `general`
 * - general 도 없으면 null (UI 비표시)
 */
export async function getActiveDisclaimerBodyForCategory(
	category: string | undefined | null,
): Promise<string | null> {
	const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
	const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseKey) {
		return null;
	}

	const cat = (category ?? '').trim();

	const tryKeys: string[] = [];
	if (cat) tryKeys.push(cat);
	if (cat === 'doctor-ai') tryKeys.push('ai');
	tryKeys.push('general');

	const seen = new Set<string>();
	for (const key of tryKeys) {
		if (seen.has(key)) continue;
		seen.add(key);
		const body = await fetchDisclaimerBody(supabaseUrl, supabaseKey, key);
		if (body) return body;
	}

	return null;
}
