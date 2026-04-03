import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.coerce.date(),
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
	}),
});

export const collections = { blog };
