import type { CollectionEntry } from 'astro:content';
import { ACADEMY_CONTENT_ID_PREFIX, ACADEMY_LEGACY_CONTENT_PREFIX } from './academy-constants';

/** @deprecated 과거 진도용 — Task 54 이후 `readPostStorageKey` 사용 */
export const SERIES_READ_STORAGE_KEY = 'sreborn_series_read_v1';

/** 읽음 완료 플래그: localStorage `read:{postId}` === 'true' (로그인 불필요) */
export const READ_POST_STORAGE_PREFIX = 'read:';

export function readPostStorageKey(postId: string): string {
	return `${READ_POST_STORAGE_PREFIX}${postId}`;
}

export function entryIsAcademyBlogId(postId: string): boolean {
	return (
		postId.startsWith(ACADEMY_CONTENT_ID_PREFIX) || postId.startsWith(ACADEMY_LEGACY_CONTENT_PREFIX)
	);
}

/** series_order(오름차순) 우선, 없으면 date 오름차순 */
export function sortSeriesPosts(a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>): number {
	const ao = a.data.series_order;
	const bo = b.data.series_order;
	if (ao != null && bo != null && ao !== bo) return ao - bo;
	if (ao != null && bo == null) return -1;
	if (ao == null && bo != null) return 1;
	return a.data.date.valueOf() - b.data.date.valueOf();
}

export function seriesHubPath(seriesName: string): string {
	return `/series/${encodeURIComponent(seriesName.trim())}/`;
}
