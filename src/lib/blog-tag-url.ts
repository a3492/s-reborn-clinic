/** 클리닉 블로그 태그 목록 URL (경로 세그먼트용 인코딩) */
export function blogTagPageHref(tag: string): string {
	const t = String(tag || '').trim();
	if (!t) return '/blog/';
	return `/blog/tag/${encodeURIComponent(t)}/`;
}
