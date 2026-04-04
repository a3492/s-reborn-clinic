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
			series: z.string().optional(),
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

export const collections = { blog };
