import GithubSlugger from 'github-slugger';

export type BlogTocItem = { depth: 2 | 3; text: string; id: string };

/** 마크다운 본문의 ## / ### 줄로 목차 생성 (rehype/MDX 제목 id와 동일 규칙: github-slugger) */
export function buildTocFromMarkdown(body: string): BlogTocItem[] {
	const slugger = new GithubSlugger();
	const items: BlogTocItem[] = [];
	for (const line of body.split('\n')) {
		const trimmed = line.trim();
		const m = /^(#{2,3})\s+(.+)$/.exec(trimmed);
		if (!m) continue;
		const depth = m[1].length as 2 | 3;
		let text = m[2].replace(/\s+#+\s*$/, '').trim();
		text = text
			.replace(/\*\*(.+?)\*\*/g, '$1')
			.replace(/`([^`]+)`/g, '$1')
			.replace(/\[(.+?)\]\([^)]*\)/g, '$1');
		const id = slugger.slug(text);
		items.push({ depth, text, id });
	}
	return items;
}
