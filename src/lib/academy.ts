import type { CollectionEntry } from 'astro:content';
import type { AcademySectionId } from './academy-constants';
export type { AcademySectionId } from './academy-constants';

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

/** Doctor AI Academy 전용 URL(/doctor-ai/...)으로 노출되는 블로그 글 */
export function isAcademyBlogPost(post: CollectionEntry<'blog'>): boolean {
	if (post.data.category === 'doctor-ai') return true;
	if (post.id.startsWith('doctor-ai/')) return true;
	return false;
}

/** /doctor-ai/[...slug] 의 params.slug (post.id 가 doctor-ai/ 로 시작하면 접두 제거) */
export function academySlugFromPostId(postId: string): string {
	if (postId.startsWith('doctor-ai/')) return postId.slice('doctor-ai/'.length);
	return postId;
}

/** 사이트 내 글 permalink (트레일링 슬래시 포함) */
export function postPermalink(post: CollectionEntry<'blog'>): string {
	if (isAcademyBlogPost(post)) {
		return `/doctor-ai/${academySlugFromPostId(post.id)}/`;
	}
	return `/blog/${post.id}/`;
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
