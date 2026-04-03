export type AdminPostStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';

export interface AdminPostDraftInput {
  title: string;
  description: string;
  slug: string;
  category?: string;
  subcategory?: string;
  tags: string[];
  thumbnailUrl?: string;
  bodyMarkdown: string;
  status: AdminPostStatus;
  publishedAt?: string | null;
  scheduledAt?: string | null;
}

export function normalizeTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function buildExcerptFallback(markdown: string): string {
  return markdown.replace(/[#*_`>\-\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
}
