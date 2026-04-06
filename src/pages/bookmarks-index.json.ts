import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { postPermalink } from '../lib/academy';

export const prerender = true;

/** 읽기 목록 페이지: slug → 제목·링크 매핑 (전체 공개 글) */
export const GET: APIRoute = async () => {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	const items = posts.map((p) => ({
		slug: p.id,
		title: p.data.title,
		description: p.data.description ?? '',
		href: postPermalink(p),
	}));

	return new Response(JSON.stringify(items), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
