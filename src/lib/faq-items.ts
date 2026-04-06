/**
 * 홈 에린이 코너 FAQ — 빌드타임 Supabase REST (anon, 공개 행만)
 */

export type PublicFaqItem = {
	id: string;
	question: string;
	answer: string;
	order_index: number;
};

export async function getVisibleFaqItems(): Promise<PublicFaqItem[]> {
	const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
	const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseKey) {
		return [];
	}

	try {
		const params = new URLSearchParams({
			select: 'id,question,answer,order_index',
			is_visible: 'eq.true',
		});
		params.append('order', 'order_index.asc');
		params.append('order', 'created_at.asc');
		const response = await fetch(`${supabaseUrl}/rest/v1/faq_items?${params}`, {
			headers: {
				apikey: supabaseKey,
				Authorization: `Bearer ${supabaseKey}`,
			},
		});

		if (!response.ok) {
			return [];
		}

		const rows = (await response.json()) as PublicFaqItem[];
		return Array.isArray(rows) ? rows : [];
	} catch {
		return [];
	}
}
