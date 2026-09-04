/** 발행·백업 공통 — 마크다운 frontmatter 및 콘텐츠 컬렉션 경로 */

export function isoNow(): string {
  return new Date().toISOString();
}

function escapeYamlString(value: unknown): string {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

export interface FrontmatterOptions {
  /**
   * Astro가 이 Markdown artifact를 production build에서 제외해야 하는지 여부.
   * DB의 editorial/publish workflow status와는 다른 개념이므로 status에서 추론하지 않는다.
   */
  draft?: boolean;
}

export function buildFrontmatter(post: Record<string, unknown>, options: FrontmatterOptions = {}): string {
  const tags = Array.isArray(post.tags)
    ? `[${(post.tags as string[]).map((tag: string) => `"${tag}"`).join(', ')}]`
    : '[]';
  const artifactDraft = options.draft ?? false;
  const parts = [
    '---',
    `title: "${escapeYamlString(post.title)}"`,
    `description: "${escapeYamlString(post.description)}"`,
    `date: ${post.published_at ?? isoNow()}`,
    `category: "${escapeYamlString(post.category)}"`,
    post.subcategory ? `subcategory: "${escapeYamlString(post.subcategory)}"` : '',
    `tags: ${tags}`,
    `draft: ${artifactDraft}`,
    post.thumbnail_url ? `thumbnail: "${escapeYamlString(post.thumbnail_url)}"` : '',
    post.seo_title ? `seoTitle: "${escapeYamlString(post.seo_title)}"` : '',
    post.seo_description ? `seoDescription: "${escapeYamlString(post.seo_description)}"` : '',
    post.canonical_url ? `canonicalURL: "${escapeYamlString(post.canonical_url)}"` : '',
    '---',
    '',
  ].filter(Boolean);
  return parts.join('\n');
}

/** GitHub 발행 시 저장 경로와 동일 (ZIP 백업 키로 재사용) */
export function buildTargetPath(post: Record<string, unknown>): string {
  const segments = ['src', 'content', 'blog'];
  segments.push(String(post.category || 'uncategorized'));
  if (post.subcategory) segments.push(String(post.subcategory));
  segments.push(`${post.slug}.md`);
  return segments.join('/');
}