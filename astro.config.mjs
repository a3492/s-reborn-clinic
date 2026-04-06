// @ts-check

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
// PWA: public/manifest.json, public/sw.js — Layout.astro·BlogPost.astro에서 등록.
export default defineConfig({
	site: 'https://s-reborn-clinic.pages.dev',
	/** 검색·공유 URL과 실제 정적 경로를 맞춰 슬래시 없는 링크 404·빈 화면을 줄입니다. */
	trailingSlash: 'always',
	output: 'static',
	adapter: cloudflare(),
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => !page.includes('/admin'),
		}),
	],
});
