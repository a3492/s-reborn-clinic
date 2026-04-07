import type { SupabaseClient } from '@supabase/supabase-js';

export const REACTION_TYPES = ['helpful', 'like', 'bookmark'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

const SESSION_STORAGE_KEY = 'sreborn_reader_session_id';

export function getOrCreateReaderSessionId(): string {
	try {
		let id = localStorage.getItem(SESSION_STORAGE_KEY);
		if (!id || !id.trim()) {
			id = crypto.randomUUID();
			localStorage.setItem(SESSION_STORAGE_KEY, id);
		}
		return id;
	} catch {
		return crypto.randomUUID();
	}
}

export type ReactionIdentity =
	| { kind: 'anon'; sessionId: string }
	| { kind: 'user'; userId: string };

export async function getReactionIdentity(supabase: SupabaseClient): Promise<ReactionIdentity> {
	const { data } = await supabase.auth.getUser();
	const uid = data.user?.id;
	if (uid) return { kind: 'user', userId: uid };
	return { kind: 'anon', sessionId: getOrCreateReaderSessionId() };
}

export async function fetchReactionCounts(
	supabase: SupabaseClient,
	slug: string
): Promise<Record<ReactionType, number>> {
	const empty: Record<ReactionType, number> = { helpful: 0, like: 0, bookmark: 0 };
	const { data, error } = await supabase.from('post_reactions').select('reaction').eq('slug', slug);
	if (error || !data) return empty;
	for (const row of data) {
		const r = row.reaction as ReactionType;
		if (r === 'helpful' || r === 'like' || r === 'bookmark') empty[r] += 1;
	}
	return empty;
}

export async function fetchMyReactions(
	supabase: SupabaseClient,
	slug: string,
	identity: ReactionIdentity
): Promise<Set<ReactionType>> {
	const set = new Set<ReactionType>();
	let q = supabase.from('post_reactions').select('reaction').eq('slug', slug);
	if (identity.kind === 'user') {
		q = q.eq('user_id', identity.userId);
	} else {
		q = q.eq('session_id', identity.sessionId).is('user_id', null);
	}
	const { data, error } = await q;
	if (error || !data) return set;
	for (const row of data) {
		const r = row.reaction as ReactionType;
		if (r === 'helpful' || r === 'like' || r === 'bookmark') set.add(r);
	}
	return set;
}

export async function togglePostReaction(
	supabase: SupabaseClient,
	slug: string,
	identity: ReactionIdentity,
	reaction: ReactionType
): Promise<'added' | 'removed' | null> {
	if (identity.kind === 'user') {
		const { data: existing } = await supabase
			.from('post_reactions')
			.select('slug')
			.eq('slug', slug)
			.eq('reaction', reaction)
			.eq('user_id', identity.userId)
			.maybeSingle();

		if (existing) {
			const { error } = await supabase
				.from('post_reactions')
				.delete()
				.eq('slug', slug)
				.eq('reaction', reaction)
				.eq('user_id', identity.userId);
			return error ? null : 'removed';
		}

		const { error } = await supabase.from('post_reactions').insert({
			slug,
			reaction,
			user_id: identity.userId,
			session_id: null,
		});
		return error ? null : 'added';
	}

	const { data: existing } = await supabase
		.from('post_reactions')
		.select('slug')
		.eq('slug', slug)
		.eq('reaction', reaction)
		.eq('session_id', identity.sessionId)
		.is('user_id', null)
		.maybeSingle();

	if (existing) {
		const { error } = await supabase
			.from('post_reactions')
			.delete()
			.eq('slug', slug)
			.eq('reaction', reaction)
			.eq('session_id', identity.sessionId)
			.is('user_id', null);
		return error ? null : 'removed';
	}

	const { error } = await supabase.from('post_reactions').insert({
		slug,
		reaction,
		session_id: identity.sessionId,
		user_id: null,
	});
	return error ? null : 'added';
}

/** 어드민: slug 목록별 반응 행 수 합산 */
export async function fetchReactionTotalsBySlugs(
	supabase: SupabaseClient,
	slugs: string[]
): Promise<Map<string, number>> {
	const map = new Map<string, number>();
	const unique = [...new Set(slugs.filter(Boolean))];
	if (!unique.length) return map;
	const { data, error } = await supabase.from('post_reactions').select('slug').in('slug', unique);
	if (error || !data) return map;
	for (const row of data) {
		const s = row.slug;
		map.set(s, (map.get(s) ?? 0) + 1);
	}
	return map;
}
