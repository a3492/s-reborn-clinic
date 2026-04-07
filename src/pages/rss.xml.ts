import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { feedSiteOrigin, postsToRssItems, RSS_MAIN_FEED_TITLE } from '../lib/rss-feed';

export const GET: APIRoute = async (context) => {
	const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
	);

	return rss({
		title: RSS_MAIN_FEED_TITLE,
		description: SITE_DESCRIPTION,
		site: feedSiteOrigin(context.site),
		items: postsToRssItems(posts, context.site),
		customData: '<language>ko-kr</language>',
		trailingSlash: true,
	});
};
