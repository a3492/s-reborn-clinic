import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const distRoot = path.resolve(process.argv[2] || 'dist');
const records = [
  ['src/content/blog/doctor-column/consultation-no-treatment.md', 'doctor-column/consultation-no-treatment'],
  ['src/content/blog/doctor-column/filler-migration.md', 'doctor-column/filler-migration'],
  ['src/content/blog/doctor-column/hifu-vs-radiofrequency.md', 'doctor-column/hifu-vs-radiofrequency'],
  ['src/content/blog/doctor-column/laser-black-balloon.md', 'doctor-column/laser-black-balloon'],
  ['src/content/blog/doctor-column/sagging-lift-fill-reduce.md', 'doctor-column/sagging-lift-fill-reduce'],
  ['src/content/blog/doctor-column/self-face-perception.md', 'doctor-column/self-face-perception'],
  ['src/content/blog/doctor-column/survivorship-bias.md', 'doctor-column/survivorship-bias'],
  ['src/content/blog/doctor-column/weight-loss-face-aging.md', 'doctor-column/weight-loss-face-aging'],
  ['src/content/blog/doctor-column/when-not-to-reduce-facial-fat.md', 'doctor-column/when-not-to-reduce-facial-fat'],
  ['src/content/blog/doctor-column/when-not-to-treat.md', 'doctor-column/when-not-to-treat'],
];

const originals = new Map();
let buildSucceeded = false;

function resolvePublicRoot() {
  const clientRoot = path.join(distRoot, 'client');
  return fs.existsSync(clientRoot) ? clientRoot : distRoot;
}

function articleHtmlPath(publicRoot, id) {
  return path.join(publicRoot, 'blog', ...id.split('/'), 'index.html');
}

function extractClassLinks(html, className) {
  const tags = html.match(/<a\b[^>]*>/g) ?? [];
  const hrefs = [];
  for (const tag of tags) {
    if (!tag.includes(className)) continue;
    const href = tag.match(/\bhref="([^"]+)"/)?.[1];
    if (href) hrefs.push(href);
  }
  return hrefs;
}

function hrefToHtmlPath(publicRoot, href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean.startsWith('/blog/')) return null;
  const relative = clean.replace(/^\//, '').replace(/\/$/, '');
  return path.join(publicRoot, ...relative.split('/'), 'index.html');
}

try {
  for (const [relativePath] of records) {
    const fullPath = path.join(repoRoot, relativePath);
    const original = fs.readFileSync(fullPath);
    const text = original.toString('utf8');
    const matches = text.match(/^draft:\s*true\s*$/gm) ?? [];
    if (matches.length !== 1) {
      throw new Error(`${relativePath}: expected exactly one 'draft: true' frontmatter line, found ${matches.length}`);
    }
    originals.set(fullPath, original);
    fs.writeFileSync(fullPath, text.replace(/^draft:\s*true\s*$/m, 'draft: false'), 'utf8');
  }

  console.log(`[journal-first10-preview] transiently activated ${records.length} drafts in the ephemeral worktree`);
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: repoRoot,
    env: { ...process.env, JOURNAL_DRAFT_PREVIEW: '1' },
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`Astro preview build failed with exit code ${result.status}`);
  buildSucceeded = true;
} finally {
  for (const [fullPath, original] of originals) fs.writeFileSync(fullPath, original);
}

if (!buildSucceeded) process.exit(1);

for (const [fullPath, original] of originals) {
  const restored = fs.readFileSync(fullPath);
  if (!restored.equals(original)) throw new Error(`${path.relative(repoRoot, fullPath)}: source restoration mismatch`);
}
console.log(`[journal-first10-preview] source restoration PASS: ${records.length}/${records.length} byte-identical`);

const publicRoot = resolvePublicRoot();
console.log(`[journal-first10-preview] inspecting output root: ${path.relative(repoRoot, publicRoot) || '.'}`);

let primaryCount = 0;
let relatedCount = 0;
const brokenLinks = [];
const generated = [];

for (const [, id] of records) {
  const htmlPath = articleHtmlPath(publicRoot, id);
  if (!fs.existsSync(htmlPath)) throw new Error(`${id}: expected preview HTML was not generated at ${path.relative(repoRoot, htmlPath)}`);

  let html = fs.readFileSync(htmlPath, 'utf8');
  const primary = extractClassLinks(html, 'journal-primary-next');
  const related = extractClassLinks(html, 'journal-related-card');
  primaryCount += primary.length;
  relatedCount += related.length;

  for (const href of [...primary, ...related]) {
    const target = hrefToHtmlPath(publicRoot, href);
    if (!target || !fs.existsSync(target)) brokenLinks.push(`${id} -> ${href}`);
  }

  const robotsMeta = '<meta name="robots" content="noindex,nofollow,noarchive" />';
  if (!html.includes('name="robots"')) {
    if (!html.includes('</head>')) throw new Error(`${id}: missing </head> for noindex injection`);
    html = html.replace('</head>', `${robotsMeta}</head>`);
    fs.writeFileSync(htmlPath, html, 'utf8');
  }

  generated.push({ id, path: path.relative(publicRoot, htmlPath), primary_next_links: primary.length, related_links: related.length });
}

if (primaryCount !== 10) throw new Error(`expected 10 rendered primary-next links, found ${primaryCount}`);
if (relatedCount !== 20) throw new Error(`expected 20 rendered related links, found ${relatedCount}`);
if (brokenLinks.length) throw new Error(`broken curated links:\n${brokenLinks.join('\n')}`);

fs.writeFileSync(
  path.join(publicRoot, '_headers'),
  '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: no-store\n',
  'utf8',
);

const landingDir = path.join(publicRoot, '__journal-preview');
fs.mkdirSync(landingDir, { recursive: true });
const landingItems = records
  .map(([, id]) => `<li><a href="/blog/${id}/">${id}</a></li>`)
  .join('\n');
fs.writeFileSync(
  path.join(landingDir, 'index.html'),
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="viewport" content="width=device-width,initial-scale=1"><title>S-Reborn Journal Draft Preview</title></head><body><main><h1>S-Reborn Journal Draft Preview</h1><p>Isolated QA artifact. Not published.</p><ol>${landingItems}</ol></main></body></html>`,
  'utf8',
);

const manifest = {
  generated_at: new Date().toISOString(),
  source_head: process.env.GITHUB_SHA ?? null,
  preview_only: true,
  repository_sources_restored: true,
  output_root: path.relative(repoRoot, publicRoot),
  article_count: records.length,
  primary_next_links: primaryCount,
  related_links: relatedCount,
  broken_curated_links: brokenLinks,
  records: generated,
};
fs.writeFileSync(path.join(landingDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`[journal-first10-preview] PASS: articles=${records.length}/10 primary_next=${primaryCount}/10 related=${relatedCount}/20 broken=0`);
console.log('[journal-first10-preview] output is preview-only and stamped noindex/no-store');
