import type { RSSFeedItem } from '@astrojs/rss';
import type { CollectionEntry } from 'astro:content';
import { postPermalink } from './academy';

export const RSS_AUTHOR = '김도위';
export const RSS_MAX_ITEMS = 50;
export const RSS_MAIN_FEED_TITLE = 'S-Reborn AI Blog';

/** RSS 링크·enclosure용 절대 URL 베이스 (astro.config `site` 우선) */
export function feedSiteOrigin(site: URL | undefined): string {
	const href = site?.href ?? 'https://s-reborn-blog.pages.dev/';
	return href.endsWith('/') ? href : `${href}/`;
}

export function guessImageMime(url: string): string {
	const lower = url.split('?')[0].toLowerCase();
	if (lower.endsWith('.png')) return 'image/png';
	if (lower.endsWith('.webp')) return 'image/webp';
	if (lower.endsWith('.gif')) return 'image/gif';
	if (lower.endsWith('.svg')) return 'image/svg+xml';
	return 'image/jpeg';
}

export function postToRssItem(post: CollectionEntry<'blog'>, site: URL | undefined): RSSFeedItem {
	const base = feedSiteOrigin(site);
	const link = new URL(postPermalink(post), base).href;
	const thumb = post.data.thumbnail?.trim();
	const categories = [
		...(post.data.category ? [post.data.category] : []),
		...((post.data.tags ?? []).filter(Boolean) as string[]),
	];
	const item: RSSFeedItem = {
		title: post.data.title,
		pubDate: post.data.date,
		description: post.data.description,
		author: RSS_AUTHOR,
		categories,
		link,
	};
	if (thumb) {
		const absThumb = thumb.startsWith('http') ? thumb : new URL(thumb, base).href;
		item.enclosure = {
			url: absThumb,
			length: 0,
			type: guessImageMime(absThumb),
		};
	}
	return item;
}

export function postsToRssItems(posts: CollectionEntry<'blog'>[], site: URL | undefined): RSSFeedItem[] {
	return posts.slice(0, RSS_MAX_ITEMS).map((p) => postToRssItem(p, site));
}
