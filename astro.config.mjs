// @ts-check
// Cloudflare KV(SITE_CACHE) 등 Pages 바인딩은 루트 wrangler.toml 을 참고합니다.

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
// PWA: public/manifest.json, public/sw.js — Layout.astro·BlogPost.astro에서 등록.
export default defineConfig({
	site: 'https://s-reborn-clinic.pages.dev',
	i18n: {
		defaultLocale: 'ko',
		locales: ['ko', 'en'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	/** 검색·공유 URL과 실제 정적 경로를 맞춰 슬래시 없는 링크 404·빈 화면을 줄입니다. */
	trailingSlash: 'always',
	output: 'static',
	adapter: cloudflare({
		routes: {
			extend: {
				exclude: [
					{ pattern: '/favicon.svg' },
					{ pattern: '/manifest.json' },
					{ pattern: '/sw.js' },
					{ pattern: '/icon-192.png' },
					{ pattern: '/icon-512.png' },
				],
			},
		},
	}),
	integrations: [
		mdx(),
		sitemap({
			filter: (page) =>
				!page.includes('/admin/') &&
				!page.includes('/api/') &&
				!page.includes('/search'),
			changefreq: 'weekly',
			priority: 0.7,
			customPages: [
				'https://s-reborn-blog.pages.dev/',
				'https://s-reborn-blog.pages.dev/blog/',
				'https://s-reborn-blog.pages.dev/about/',
			],
			serialize: (item) => {
				try {
					const u = new URL(item.url);
					const path = u.pathname.replace(/\/$/, '') || '/';
					if (path === '/' || path === '/blog') {
						return { ...item, priority: 1.0, changefreq: 'daily' };
					}
				} catch {
					/* ignore */
				}
				return item;
			},
		}),
	],
});
