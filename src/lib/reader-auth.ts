/** 독자 OAuth 후 복귀 경로 (같은 출처 상대 경로만) */
export const READER_RETURN_STORAGE_KEY = 'sreborn_oauth_return_url';

export function safeInternalPath(raw: string | null | undefined): string {
	const t = (raw ?? '').trim();
	if (!t.startsWith('/') || t.startsWith('//')) return '/';
	return t;
}

export function readerLoginHref(currentPathWithSearch: string): string {
	const ret = encodeURIComponent(safeInternalPath(currentPathWithSearch) || '/');
	return `/login/?return=${ret}`;
}
