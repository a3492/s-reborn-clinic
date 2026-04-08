import type { SupabaseClient } from '@supabase/supabase-js';

export type TrendingPostRow = {
	slug: string;
	title: string;
	description: string | null;
	category: string | null;
	published_at: string | null;
	thumbnail_url: string | null;
	trend_score: number | string | null;
};

export async function fetchTrendingPosts(
	supabase: SupabaseClient,
	daysBack: number,
	resultLimit: number,
): Promise<TrendingPostRow[]> {
	const { data, error } = await supabase.rpc('get_trending_posts', {
		days_back: daysBack,
		result_limit: resultLimit,
	});
	if (error || !Array.isArray(data)) return [];
	return data as TrendingPostRow[];
}

export async function fetchTopPostsByViews(
	supabase: SupabaseClient,
	resultLimit: number,
): Promise<TrendingPostRow[]> {
	const { data, error } = await supabase.rpc('get_top_posts_by_views', {
		result_limit: resultLimit,
	});
	if (error || !Array.isArray(data)) return [];
	return data as TrendingPostRow[];
}
