import rss from '@astrojs/rss';
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES, SITE_DESCRIPTION } from '../../consts';
import { feedSiteOrigin, postsToRssItems } from '../../lib/rss-feed';

export const getStaticPaths: GetStaticPaths = () =>
	CATEGORIES.map((c) => ({ params: { category: c.id } }));

export const GET: APIRoute = async (context) => {
	const category = context.params.category;
	if (!category || typeof category !== 'string') {
		return new Response('Not found', { status: 404 });
	}

	const catMeta = CATEGORIES.find((c) => c.id === category);
	const label = catMeta?.label ?? category;

	const posts = (await getCollection('blog', ({ data }) => !data.draft && data.category === category)).sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
	);

	return rss({
		title: `S-Reborn — ${label}`,
		description: SITE_DESCRIPTION,
		site: feedSiteOrigin(context.site),
		items: postsToRssItems(posts, context.site),
		customData: '<language>ko-kr</language>',
		trailingSlash: true,
	});
};
