import type { CollectionEntry } from 'astro:content';
import type { AcademySectionId } from './academy-constants';
import {
	ACADEMY_CONTENT_ID_PREFIX,
	ACADEMY_LEGACY_CONTENT_PREFIX,
	ACADEMY_PUBLIC_PATH,
} from './academy-constants';

export type { AcademySectionId } from './academy-constants';
export { ACADEMY_PUBLIC_PATH, ACADEMY_CONTENT_ID_PREFIX } from './academy-constants';

export const ACADEMY_SECTIONS: {
	id: AcademySectionId;
	label: string;
	blurb: string;
	icon: string;
}[] = [
	{
		id: 'fundamentals',
		label: 'Fundamentals',
		blurb: 'AI 개념, 한계, 규제·윤리 등 임상에 필요한 기초',
		icon: '📚',
	},
	{
		id: 'prompts',
		label: 'Prompts',
		blurb: '의무기록·설명·검토 등 바로 쓰는 프롬프트',
		icon: '✳️',
	},
	{
		id: 'cases',
		label: 'Cases',
		blurb: '증례·워크플로 기반 실전 활용',
		icon: '📋',
	},
	{
		id: 'tools',
		label: 'Tools',
		blurb: '도구 비교·도입 체크리스트',
		icon: '🛠️',
	},
];

/** Doctor AI Academy 전용 URL으로 노출되는 블로그 글 */
export function isAcademyBlogPost(post: CollectionEntry<'blog'>): boolean {
	if (post.data.category === 'doctor-ai') return true;
	if (post.id.startsWith(ACADEMY_CONTENT_ID_PREFIX)) return true;
	if (post.id.startsWith(ACADEMY_LEGACY_CONTENT_PREFIX)) return true;
	return false;
}

/** `ACADEMY_PUBLIC_PATH/[...slug]` 의 params.slug */
export function academySlugFromPostId(postId: string): string {
	if (postId.startsWith(ACADEMY_CONTENT_ID_PREFIX)) {
		return postId.slice(ACADEMY_CONTENT_ID_PREFIX.length);
	}
	if (postId.startsWith(ACADEMY_LEGACY_CONTENT_PREFIX)) {
		return postId.slice(ACADEMY_LEGACY_CONTENT_PREFIX.length);
	}
	return postId;
}

/** 사이트 내 글 permalink (트레일링 슬래시 포함) */
export function postPermalink(post: CollectionEntry<'blog'>): string {
	if (isAcademyBlogPost(post)) {
		return `${ACADEMY_PUBLIC_PATH}/${academySlugFromPostId(post.id)}/`;
	}
	return `/blog/${post.id}/`;
}

/** Supabase `posts.slug` 등 DB 슬러그 → 공개 URL (세그먼트 인코딩, Academy 접두 처리) */
export function postHrefFromDbSlug(slug: string): string {
	const s = String(slug || '').trim();
	if (!s) return '/blog/';
	const enc = (path: string) =>
		path
			.split('/')
			.map((x) => x.trim())
			.filter(Boolean)
			.map((seg) => encodeURIComponent(seg))
			.join('/');
	if (s.startsWith(ACADEMY_CONTENT_ID_PREFIX)) {
		const rest = s.slice(ACADEMY_CONTENT_ID_PREFIX.length);
		return `${ACADEMY_PUBLIC_PATH}/${enc(rest)}/`;
	}
	if (s.startsWith(ACADEMY_LEGACY_CONTENT_PREFIX)) {
		const rest = s.slice(ACADEMY_LEGACY_CONTENT_PREFIX.length);
		return `${ACADEMY_PUBLIC_PATH}/${enc(rest)}/`;
	}
	return `/blog/${enc(s)}/`;
}

export function sortAcademyPosts(a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>): number {
	const ao = a.data.academy_order;
	const bo = b.data.academy_order;
	if (ao != null && bo != null && ao !== bo) return ao - bo;
	if (ao != null && bo == null) return -1;
	if (ao == null && bo != null) return 1;
	const so = (a.data.series_order ?? 0) - (b.data.series_order ?? 0);
	if (so !== 0) return so;
	return b.data.date.valueOf() - a.data.date.valueOf();
}

export function filterAcademyBySection(
	posts: CollectionEntry<'blog'>[],
	section: AcademySectionId
): CollectionEntry<'blog'>[] {
	return posts
		.filter((p) => isAcademyBlogPost(p) && p.data.academy_section === section)
		.sort(sortAcademyPosts);
}
