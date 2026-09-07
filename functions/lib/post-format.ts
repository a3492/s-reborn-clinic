/** 발행·백업 공통 — 마크다운 frontmatter 및 콘텐츠 컬렉션 경로 */

export function isoNow(): string {
  return new Date().toISOString();
}

function escapeYamlString(value: unknown): string {
  return String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

function yamlString(value: unknown): string {
  return `"${escapeYamlString(value)}"`;
}

/** JSON flow style은 YAML 1.2에서 유효하므로 배열·객체 frontmatter를 안전하게 직렬화하는 데 사용한다. */
function yamlJson(value: unknown, fallback: unknown): string {
  try {
    return JSON.stringify(value ?? fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}

export interface FrontmatterOptions {
  /**
   * Astro가 이 Markdown artifact를 production build에서 제외해야 하는지 여부.
   * DB의 editorial/publish workflow status와는 다른 개념이므로 status에서 추론하지 않는다.
   */
  draft?: boolean;
}

/**
 * 현재 static route와 동일한 public path를 계산한다.
 * 이 값은 주소/배포 artifact 식별자이고 canonical identity는 항상 posts.id(content_id)다.
 */
export function buildPublicPath(post: Record<string, unknown>): string {
  const category = String(post.category || 'uncategorized');
  const nested = [post.subcategory ? String(post.subcategory) : '', String(post.slug || '')]
    .filter(Boolean)
    .join('/');

  if (category === 'doctor-ai' || category === 'doctor-ai-academy') {
    return `/doctor-ai-academy/${nested}/`;
  }

  return `/blog/${[category, nested].filter(Boolean).join('/')}/`;
}

export function buildFrontmatter(post: Record<string, unknown>, options: FrontmatterOptions = {}): string {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const relatedSlugs = Array.isArray(post.related_slugs) ? post.related_slugs : [];
  const referenceLinks = Array.isArray(post.reference_links) ? post.reference_links : [];
  const artifactDraft = options.draft ?? false;
  const publicPath = post.public_path ? String(post.public_path) : buildPublicPath(post);

  const parts = [
    '---',
    post.id ? `content_id: ${yamlString(post.id)}` : '',
    `locale: ${yamlString(post.locale || 'ko')}`,
    `content_type: ${yamlString(post.content_type || 'article')}`,
    `source_system: ${yamlString(post.source_system || 'manual')}`,
    post.source_external_id ? `source_external_id: ${yamlString(post.source_external_id)}` : '',
    post.source_version ? `source_version: ${yamlString(post.source_version)}` : '',
    post.source_hash ? `source_hash: ${yamlString(post.source_hash)}` : '',
    post.content_version != null ? `content_version: ${Number(post.content_version)}` : '',
    publicPath ? `public_path: ${yamlString(publicPath)}` : '',
    `title: ${yamlString(post.title)}`,
    `description: ${yamlString(post.description)}`,
    `date: ${post.published_at ?? isoNow()}`,
    post.content_updated_at ? `updated: ${post.content_updated_at}` : '',
    `category: ${yamlString(post.category)}`,
    post.subcategory ? `subcategory: ${yamlString(post.subcategory)}` : '',
    `tags: ${yamlJson(tags, [])}`,
    `draft: ${artifactDraft}`,
    post.thumbnail_url ? `thumbnail: ${yamlString(post.thumbnail_url)}` : '',
    post.series ? `series: ${yamlString(post.series)}` : '',
    typeof post.series_order === 'number' ? `series_order: ${post.series_order}` : '',
    post.lead ? `lead: ${yamlString(post.lead)}` : '',
    post.thumbnail_label ? `thumbnail_label: ${yamlString(post.thumbnail_label)}` : '',
    post.content_role ? `content_role: ${yamlString(post.content_role)}` : '',
    post.primary_next_slug ? `primary_next: ${yamlString(post.primary_next_slug)}` : '',
    relatedSlugs.length > 0 ? `related: ${yamlJson(relatedSlugs, [])}` : '',
    referenceLinks.length > 0 ? `references: ${yamlJson(referenceLinks, [])}` : '',
    post.case_disclosure ? `case_disclosure: ${yamlString(post.case_disclosure)}` : '',
    post.social_hook ? `social_hook: ${yamlString(post.social_hook)}` : '',
    post.seo_title ? `seoTitle: ${yamlString(post.seo_title)}` : '',
    post.seo_description ? `seoDescription: ${yamlString(post.seo_description)}` : '',
    post.canonical_url ? `canonicalURL: ${yamlString(post.canonical_url)}` : '',
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
