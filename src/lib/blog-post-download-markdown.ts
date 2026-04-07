import type { CollectionEntry } from 'astro:content';

function yamlEscape(s: string): string {
	return String(s).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n');
}

/**
 * 블로그 글 MD 다운로드용 — frontmatter(YAML) + 원본 본문(post.body).
 * 값은 HTML/속성에 넣기 전 encodeURIComponent 로 한 번 더 감쌀 것.
 */
export function buildBlogPostDownloadMarkdown(post: CollectionEntry<'blog'>): string {
	const d = post.data;
	const lines: string[] = ['---'];

	lines.push(`title: "${yamlEscape(d.title)}"`);
	lines.push(`description: "${yamlEscape(d.description)}"`);
	lines.push(`date: ${d.date.toISOString().slice(0, 10)}`);

	if (d.category != null && String(d.category).trim() !== '') {
		lines.push(`category: "${yamlEscape(String(d.category))}"`);
	}
	if (d.subcategory != null && String(d.subcategory).trim() !== '') {
		lines.push(`subcategory: "${yamlEscape(String(d.subcategory))}"`);
	}
	if (d.pillar) {
		lines.push(`pillar: "${yamlEscape(d.pillar)}"`);
	}
	const thumb = d.thumbnail != null ? String(d.thumbnail).trim() : '';
	if (thumb) {
		lines.push(`thumbnail: "${yamlEscape(thumb)}"`);
	}

	lines.push(`draft: ${d.draft ?? false}`);

	const tags = d.tags ?? [];
	if (tags.length > 0) {
		lines.push(`tags: [${tags.map((t) => `"${yamlEscape(t)}"`).join(', ')}]`);
	}

	if (d.read_time != null) {
		lines.push(`read_time: ${d.read_time}`);
	}
	if (d.difficulty) {
		lines.push(`difficulty: "${yamlEscape(d.difficulty)}"`);
	}
	if (d.type != null && String(d.type).trim() !== '') {
		lines.push(`type: "${yamlEscape(String(d.type))}"`);
	}
	const series = (d.series ?? '').trim();
	if (series) {
		lines.push(`series: "${yamlEscape(series)}"`);
	}
	if (d.series_order != null) {
		lines.push(`series_order: ${d.series_order}`);
	}
	if (d.academy_section) {
		lines.push(`academy_section: "${yamlEscape(d.academy_section)}"`);
	}
	if (d.academy_order != null) {
		lines.push(`academy_order: ${d.academy_order}`);
	}

	lines.push('---');
	return `${lines.join('\n')}\n\n${post.body}`;
}
