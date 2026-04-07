import { createClient } from '@supabase/supabase-js';
import { isLocalBookmarked, readLocalBookmarkSlugs, setLocalBookmark } from './reader-bookmarks';

function syncBookmarkButtonUi(btn: HTMLButtonElement, saved: boolean) {
	btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
	btn.classList.toggle('is-saved', saved);
	const outline = btn.querySelector('[data-bookmark-icon-outline]');
	const filled = btn.querySelector('[data-bookmark-icon-filled]');
	outline?.toggleAttribute('hidden', saved);
	filled?.toggleAttribute('hidden', !saved);
}

export function mountReaderBookmarkButtons() {
	const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
	const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
	const buttons = document.querySelectorAll<HTMLButtonElement>('[data-reader-bookmark]');
	if (!buttons.length) return;

	const supabase =
		url && key
			? createClient(url, key, {
					auth: {
						persistSession: true,
						autoRefreshToken: true,
						detectSessionInUrl: false,
					},
				})
			: null;

	for (const btn of buttons) {
		const slug = btn.dataset.slug?.trim() ?? '';
		if (!slug) continue;

		let inFlight = false;

		const refresh = async () => {
			if (!supabase) {
				syncBookmarkButtonUi(btn, isLocalBookmarked(slug));
				return;
			}
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user?.id) {
				const { data } = await supabase
					.from('bookmarks')
					.select('id')
					.eq('user_id', user.id)
					.eq('slug', slug)
					.maybeSingle();
				syncBookmarkButtonUi(btn, !!data);
			} else {
				syncBookmarkButtonUi(btn, isLocalBookmarked(slug));
			}
		};

		btn.addEventListener('click', async () => {
			if (inFlight) return;
			const wasSaved = btn.getAttribute('aria-pressed') === 'true';
			const next = !wasSaved;
			inFlight = true;
			syncBookmarkButtonUi(btn, next);
			try {
				if (supabase) {
					const {
						data: { user },
					} = await supabase.auth.getUser();
					if (user?.id) {
						if (next) {
							const { error } = await supabase.from('bookmarks').upsert(
								{ user_id: user.id, slug },
								{ onConflict: 'user_id,slug' },
							);
							if (error) throw error;
						} else {
							const { error } = await supabase
								.from('bookmarks')
								.delete()
								.eq('user_id', user.id)
								.eq('slug', slug);
							if (error) throw error;
						}
					} else {
						setLocalBookmark(slug, next);
					}
				} else {
					setLocalBookmark(slug, next);
				}
				globalThis.gtag?.('event', 'reader_bookmark', { slug, action: next ? 'add' : 'remove' });
			} catch {
				syncBookmarkButtonUi(btn, wasSaved);
			} finally {
				inFlight = false;
				await refresh();
			}
		});

		if (supabase) {
			supabase.auth.onAuthStateChange(() => {
				void refresh();
			});
		}
		void refresh();
	}
}

export type BookmarkMetaItem = { slug: string; title: string; description: string; href: string };

export async function fetchBookmarkMetaIndex(): Promise<Map<string, BookmarkMetaItem>> {
	const map = new Map<string, BookmarkMetaItem>();
	try {
		const res = await fetch('/bookmarks-index.json');
		if (!res.ok) return map;
		const arr = (await res.json()) as BookmarkMetaItem[];
		if (!Array.isArray(arr)) return map;
		for (const row of arr) {
			if (row?.slug) map.set(row.slug, row);
		}
	} catch {
		/* ignore */
	}
	return map;
}

export async function removeReaderBookmark(
	supabase: ReturnType<typeof createClient> | null,
	slug: string,
): Promise<boolean> {
	const s = slug.trim();
	if (!s) return false;
	try {
		if (supabase) {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user?.id) {
				const { error } = await supabase
					.from('bookmarks')
					.delete()
					.eq('user_id', user.id)
					.eq('slug', s);
				return !error;
			}
		}
		setLocalBookmark(s, false);
		return true;
	} catch {
		return false;
	}
}

export async function loadBookmarkSlugsForList(supabase: ReturnType<typeof createClient> | null): Promise<string[]> {
	if (supabase) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (user?.id) {
			const { data, error } = await supabase
				.from('bookmarks')
				.select('slug')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });
			if (error || !data) return [];
			return data.map((r) => r.slug).filter(Boolean);
		}
	}
	return readLocalBookmarkSlugs();
}
