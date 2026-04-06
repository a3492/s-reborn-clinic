/** 비로그인 독자 북마크 (slug 배열 JSON) */
export const READER_BOOKMARKS_LS_KEY = 'sreborn_reader_bookmarks_v1';

export function readLocalBookmarkSlugs(): string[] {
	try {
		const raw = localStorage.getItem(READER_BOOKMARKS_LS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
	} catch {
		return [];
	}
}

export function writeLocalBookmarkSlugs(slugs: string[]): void {
	const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
	localStorage.setItem(READER_BOOKMARKS_LS_KEY, JSON.stringify(unique));
}

export function setLocalBookmark(slug: string, on: boolean): void {
	const s = slug.trim();
	if (!s) return;
	const cur = readLocalBookmarkSlugs();
	if (on) {
		if (!cur.includes(s)) writeLocalBookmarkSlugs([...cur, s]);
	} else {
		writeLocalBookmarkSlugs(cur.filter((x) => x !== s));
	}
}

export function isLocalBookmarked(slug: string): boolean {
	return readLocalBookmarkSlugs().includes(slug.trim());
}
