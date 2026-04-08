// @ts-check
// Cloudflare KV(SITE_CACHE) 등 Pages 바인딩은 루트 wrangler.toml 을 참고합니다.

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
// PWA: public/manifest.json, public/sw.js — Layout.astro·BlogPost.astro에서 등록.
// NOTE: hybrid = 대부분 정적 프리렌더 + 일부 SSR (prerender=false 페이지).
//       Cloudflare adapter가 SSR 페이지를 Workers로 처리.
export default defineConfig({
	site: 'https://s-reborn-clinic.pages.dev',
	markdown: {
		// gfm: false → remarkGfm을 수동 등록해 singleTilde 옵션을 제어합니다.
		// singleTilde: false — 단일 물결표(~)를 취소선으로 파싱하지 않습니다.
		//   배경: 한국어 콘텐츠에서 범위 표기(예: 4~6주, 3~6개월)에 사용하는 ~가
		//         Markdown GFM 취소선 문법으로 오파싱되어 <del> 태그가 렌더링되던 문제.
		//   영향: 모든 .md / .mdx 파일에 전역 적용 — 신규 글 포함 자동 적용됩니다.
		//   주의: 의도적 취소선이 필요하면 ~~텍스트~~ (이중 물결표)를 사용하세요.
		//
		// * (별표) 관련: 기존 콘텐츠는 **볼드**/**이탤릭* 오파싱 없음 확인.
		//   단, 별표를 일반 문자로 쓸 때는 반드시 \* 로 이스케이프하세요.
		gfm: false,
		remarkPlugins: [[remarkGfm, { singleTilde: false }]],
	},
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
	adapter: cloudflare(),
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
				'https://s-reborn-clinic.pages.dev/',
				'https://s-reborn-clinic.pages.dev/blog/',
				'https://s-reborn-clinic.pages.dev/about/',
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
