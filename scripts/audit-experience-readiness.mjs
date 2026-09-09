#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_ROOT = path.join(ROOT, 'src', 'content', 'blog');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && /\.mdx?$/.test(entry.name) ? [full] : [];
  });
}

function stripQuotes(value) {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { raw: '', keys: new Map() };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { raw: '', keys: new Map() };
  const raw = text.slice(3, end).trim();
  const keys = new Map();
  for (const line of raw.split(/\r?\n/)) {
    if (!line || /^\s/.test(line) || line.trim().startsWith('#')) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    keys.set(match[1], stripQuotes(match[2]));
  }
  return { raw, keys };
}

function boolLike(v) {
  if (v == null) return null;
  if (/^true$/i.test(v)) return true;
  if (/^false$/i.test(v)) return false;
  return null;
}

const files = walk(BLOG_ROOT).sort();
const rows = files.map((file) => {
  const rel = path.relative(ROOT, file).replaceAll(path.sep, '/');
  const parts = rel.split('/');
  const categoryDir = parts.length > 3 ? parts[3] : 'unknown';
  const slug = path.basename(file).replace(/\.mdx?$/, '');
  const text = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  const has = (key) => fm.keys.has(key);
  const val = (key) => fm.keys.get(key) ?? null;

  const issues = [];
  if (!has('title')) issues.push('MISSING_TITLE');
  if (!has('description')) issues.push('MISSING_DESCRIPTION');
  if (has('seoDescription')) issues.push('LEGACY_SEO_DESCRIPTION');
  if (!has('draft')) issues.push('DRAFT_STATE_IMPLICIT');
  if (!has('primary_next')) issues.push('NO_PRIMARY_NEXT_FIELD');
  if (!has('related')) issues.push('NO_RELATED_FIELD');
  if (!has('content_role')) issues.push('NO_CONTENT_ROLE_FIELD');

  return {
    path: rel,
    category_dir: categoryDir,
    slug,
    bytes: Buffer.byteLength(text),
    title: val('title'),
    description_present: has('description'),
    category_field: val('category'),
    draft: boolLike(val('draft')),
    has_tags: has('tags'),
    has_primary_next: has('primary_next'),
    has_related: has('related'),
    has_series: has('series'),
    has_content_role: has('content_role'),
    has_case_disclosure: has('case_disclosure'),
    has_legacy_seo_description: has('seoDescription'),
    issues,
  };
});

const categoryCounts = {};
const issueCounts = {};
for (const row of rows) {
  categoryCounts[row.category_dir] = (categoryCounts[row.category_dir] ?? 0) + 1;
  for (const issue of row.issues) issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
}

const summary = {
  generated_at: new Date().toISOString(),
  mode: 'read-only',
  root: 'src/content/blog',
  total_files: rows.length,
  categories: categoryCounts,
  draft_true: rows.filter((r) => r.draft === true).length,
  draft_false: rows.filter((r) => r.draft === false).length,
  draft_unknown: rows.filter((r) => r.draft === null).length,
  with_primary_next: rows.filter((r) => r.has_primary_next).length,
  with_related: rows.filter((r) => r.has_related).length,
  with_content_role: rows.filter((r) => r.has_content_role).length,
  with_case_disclosure: rows.filter((r) => r.has_case_disclosure).length,
  issue_counts: issueCounts,
};

const result = { summary, files: rows };
const json = JSON.stringify(result, null, 2) + '\n';

const outIndex = process.argv.indexOf('--out');
if (outIndex >= 0) {
  const requested = process.argv[outIndex + 1];
  if (!requested) throw new Error('--out requires a file path');
  const out = path.resolve(ROOT, requested);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, json);
  console.error(`Experience readiness audit written to ${path.relative(ROOT, out)}`);
} else {
  process.stdout.write(json);
}

// This audit intentionally never rewrites source Markdown and never exits nonzero
// because legacy files are inventory inputs, not automatically invalid production data.
