import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isAcademyBlogPost } from '../../lib/academy';

export const prerender = true;

/** Topbar Fuse 폴백용 — 클리닉 블로그 글만 (Academy 제외) */
export const GET: APIRoute = async () => {
	const posts = (await getCollection('blog', ({ data }) => !data.draft))
		.filter((p) => !isAcademyBlogPost(p))
		.map((p) => ({
			slug: p.id,
			title: p.data.title,
			description: p.data.description ?? '',
			category: p.data.category ?? '',
			tags: p.data.tags ?? [],
		}));

	return new Response(JSON.stringify(posts), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
