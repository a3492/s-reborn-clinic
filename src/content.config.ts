import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ACADEMY_SECTION_IDS } from './lib/academy-constants';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z
		.object({
			title: z.string(),
			description: z.string(),
			date: z.coerce.date(),
			/** 시술 안내 4축과 매칭 — 심화·FAQ 등 영역별 필터용 (선택) */
			pillar: z.enum(['ebd', 'injection', 'oral', 'topical']).optional(),
			category: z.string().optional(),
			subcategory: z.string().optional(),
			tags: z.array(z.string()).optional().default([]),
			thumbnail: z.string().optional(),
			draft: z.boolean().optional().default(false),
			read_time: z.number().optional(),
			difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
			type: z.string().optional(),
			/**
			 * 시리즈 묶음 이름(예: "5분 AI 시리즈", "입문 시리즈"). 같은 문자열이면 한 시리즈로 묶입니다.
			 * MD 예: `series: "5분 AI 시리즈"` (+ 선택 `series_order: 1` 로 순서 지정, 없으면 date 오름차순)
			 * Supabase `posts` 테이블에는 `series` 컬럼이 없으면 migrations/20260407_posts_series_column.sql 적용 후 에디터·동기화에 반영하세요.
			 */
			series: z.string().optional(),
			/** 같은 series 내 표시 순서(작을수록 앞). 미지정 글은 date 순으로 뒤에 이어짐 */
			series_order: z.number().optional(),
			/** Doctor AI Academy 섹션 — category 가 doctor-ai 일 때 필수 */
			academy_section: z.enum(ACADEMY_SECTION_IDS).optional(),
			/** 같은 섹션 내 정렬(작을수록 앞) — 미지정 시 날짜순 */
			academy_order: z.number().int().min(1).optional(),
		})
		.superRefine((data, ctx) => {
			if (data.academy_section != null && data.category !== 'doctor-ai') {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'academy_section 은 category 가 doctor-ai 일 때만 사용할 수 있습니다.',
					path: ['academy_section'],
				});
			}
			if (data.category === 'doctor-ai' && data.academy_section == null) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'category 가 doctor-ai 이면 academy_section 이 필요합니다.',
					path: ['academy_section'],
				});
			}
		}),
});

const procedures = defineCollection({
	loader: glob({ base: './src/content/procedures', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		/** SEO 메인 키워드 */
		seo_title: z.string().optional(),
		/** SEO 서브 키워드 배열 */
		keywords: z.array(z.string()).optional().default([]),
		/** 4축 카테고리 */
		pillar: z.enum(['ebd', 'injection', 'oral', 'topical']),
		/** 서브그룹 (예: RF, 레이저, 필러 등) */
		category: z.string(),
		tags: z.array(z.string()).optional().default([]),
		/** 관련 시술 slug 목록 (내부 링크용) */
		related: z.array(z.string()).optional().default([]),
		draft: z.boolean().optional().default(false),
		/** 마지막 업데이트 날짜 */
		updated: z.coerce.date().optional(),
		/**
		 * 부모 시술 slug — 토픽 아티클에서 사용. 예: 'monopolar-rf'
		 * 같은 procedure_item 을 가진 글들이 하나의 시술 아래 묶입니다.
		 */
		procedure_item: z.string().optional(),
		/**
		 * 토픽 종류 — 'overview' | 'mechanism' | 'equipment' | 'protocol'
		 *   | 'combination' | 'side-effects' | 'research' | 'faq'
		 *   | 'pharmacology' | 'products' | 'monitoring' | 'concentration'
		 */
		topic: z.string().optional(),
		/** 사이드바·목차에 표시할 한국어 레이블 예: '원리·기초' */
		topic_label: z.string().optional(),
		/** 같은 procedure_item 내 표시 순서 (작을수록 앞) */
		topic_order: z.number().int().min(1).optional(),
	}),
});

export const collections = { blog, procedures };
