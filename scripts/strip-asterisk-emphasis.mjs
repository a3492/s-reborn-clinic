/**
 * 블로그 MD 본문에서 **굵게** / *기울임* 마크다운 표기를 제거(별표만 제거, 글자는 유지).
 * - YAML frontmatter(--- ... ---)는 변경하지 않음
 * - ``` 펜스 코드 블록 ``` 내부는 변경하지 않음
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const blogDir = path.join(root, 'src', 'content', 'blog');

function stripEmphasisInSegment(seg) {
	let t = seg;
	let prev;
	do {
		prev = t;
		t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
	} while (t !== prev);
	t = t.replace(/\*([^*\n]+)\*/g, '$1');
	return t;
}

function transformBody(body) {
	const chunks = body.split(/(```[\s\S]*?```)/g);
	return chunks
		.map((chunk, i) => (i % 2 === 1 ? chunk : stripEmphasisInSegment(chunk)))
		.join('');
}

function processFile(filePath) {
	const raw = fs.readFileSync(filePath, 'utf8');
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	let next;
	if (m) {
		next = `---\n${m[1]}\n---\n${transformBody(m[2])}`;
	} else {
		next = transformBody(raw);
	}
	if (next !== raw) {
		fs.writeFileSync(filePath, next, 'utf8');
		return true;
	}
	return false;
}

function walk(dir) {
	let n = 0;
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) n += walk(p);
		else if (ent.name.endsWith('.md') && processFile(p)) n++;
	}
	return n;
}

const count = walk(blogDir);
console.log(`Updated ${count} markdown file(s) under src/content/blog`);
