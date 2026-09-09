import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'src/content/blog/doctor-column');
const slugs = [
  'consultation-no-treatment',
  'filler-migration',
  'hifu-vs-radiofrequency',
  'laser-black-balloon',
  'sagging-lift-fill-reduce',
  'self-face-perception',
  'survivorship-bias',
  'weight-loss-face-aging',
  'when-not-to-reduce-facial-fat',
  'when-not-to-treat',
];
const caseDisclosureRequired = new Set([
  'consultation-no-treatment',
  'when-not-to-reduce-facial-fat',
]);

function frontmatterOf(raw) {
  if (!raw.startsWith('---\n')) return null;
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return raw.slice(4, end);
}

function getScalar(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

function getString(fm, key) {
  const raw = getScalar(fm, key);
  if (!raw) return null;
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  return raw;
}

function getInlineArray(fm, key) {
  const raw = getScalar(fm, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function addFinding(list, code, detail, slug = null) {
  list.push(slug ? { code, slug, detail } : { code, detail });
}

const structuralErrors = [];
const releaseBlockers = [];
const articles = [];
let primaryNextCount = 0;
let relatedCount = 0;
let referenceCount = 0;

for (const slug of slugs) {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) {
    addFinding(structuralErrors, 'FILE_MISSING', file, slug);
    continue;
  }

  const raw = fs.readFileSync(file, 'utf8');
  const fm = frontmatterOf(raw);
  if (!fm) {
    addFinding(structuralErrors, 'FRONTMATTER_INVALID', 'frontmatter boundary missing', slug);
    continue;
  }

  const required = ['title', 'description', 'date', 'updated', 'category', 'lead', 'thumbnail_label', 'content_role', 'series', 'series_order', 'primary_next', 'related', 'references', 'draft'];
  for (const key of required) {
    if (getScalar(fm, key) == null) addFinding(structuralErrors, 'REQUIRED_FIELD_MISSING', key, slug);
  }

  const draft = getScalar(fm, 'draft');
  if (draft !== 'true') addFinding(structuralErrors, 'DRAFT_HOLD_BROKEN', `expected true, got ${draft}`, slug);

  const category = getString(fm, 'category');
  if (category !== 'doctor-column') addFinding(structuralErrors, 'CATEGORY_UNEXPECTED', String(category), slug);

  const primaryNext = getString(fm, 'primary_next');
  const related = getInlineArray(fm, 'related') ?? [];
  const referencesRaw = getScalar(fm, 'references') ?? '';
  const references = [...referencesRaw.matchAll(/"url"\s*:/g)].length;
  const thumbnail = getString(fm, 'thumbnail');
  const date = getString(fm, 'date');

  if (!primaryNext) {
    addFinding(structuralErrors, 'PRIMARY_NEXT_MISSING', '', slug);
  } else {
    primaryNextCount += 1;
    if (!slugs.includes(primaryNext)) addFinding(structuralErrors, 'PRIMARY_NEXT_UNRESOLVED', primaryNext, slug);
    if (primaryNext === slug) addFinding(structuralErrors, 'PRIMARY_NEXT_SELF_REFERENCE', primaryNext, slug);
  }

  if (!Array.isArray(related) || related.length !== 2) {
    addFinding(structuralErrors, 'RELATED_COUNT_INVALID', `expected 2, got ${Array.isArray(related) ? related.length : 'unparseable'}`, slug);
  } else {
    relatedCount += related.length;
    for (const target of related) {
      if (!slugs.includes(target)) addFinding(structuralErrors, 'RELATED_UNRESOLVED', target, slug);
      if (target === slug) addFinding(structuralErrors, 'RELATED_SELF_REFERENCE', target, slug);
      if (target === primaryNext) addFinding(structuralErrors, 'RELATED_DUPLICATES_PRIMARY_NEXT', target, slug);
    }
  }

  if (references < 1) addFinding(structuralErrors, 'REFERENCES_MISSING', '', slug);
  referenceCount += references;

  if (caseDisclosureRequired.has(slug) && !getString(fm, 'case_disclosure')) {
    addFinding(structuralErrors, 'CASE_DISCLOSURE_MISSING', 'composite-case disclosure required', slug);
  }

  if (!thumbnail) addFinding(releaseBlockers, 'HERO_ASSET_MISSING', 'thumbnail field is absent', slug);
  if (date?.startsWith('2026-09-03')) addFinding(releaseBlockers, 'RELEASE_DATE_UNCONFIRMED', date, slug);

  articles.push({
    slug,
    draft: draft === 'true',
    primary_next: primaryNext,
    related,
    references,
    thumbnail: thumbnail ?? null,
    date: date ?? null,
    case_disclosure: Boolean(getString(fm, 'case_disclosure')),
  });
}

const configPath = path.join(ROOT, 'src/content.config.ts');
const layoutPath = path.join(ROOT, 'src/layouts/BlogPost.astro');
const configText = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
const layoutText = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, 'utf8') : '';
const customThumbnailAltSupported = /thumbnail_alt/.test(configText) && /thumbnail_alt/.test(layoutText);
if (!customThumbnailAltSupported) {
  addFinding(releaseBlockers, 'CUSTOM_THUMBNAIL_ALT_NOT_SUPPORTED', 'current schema has no thumbnail_alt and BlogPost uses the article title as hero alt text');
}

const manualGates = [
  'HERO_ALT_CROP_MOBILE_CARD_QA',
  'DESKTOP_MOBILE_DARK_VISUAL_QA',
  'RELATION_CLICK_RUNTIME_QA',
  'MEDICAL_EDITORIAL_FINAL_REVIEW',
  'SEPARATE_RELEASE_PR_DRAFT_FALSE',
];

const report = {
  audit: 'journal-first10-release-readiness-v01',
  generated_at: new Date().toISOString(),
  source_policy: 'read-only; article files are never rewritten',
  expected_article_count: slugs.length,
  observed_article_count: articles.length,
  structural_status: structuralErrors.length === 0 ? 'PASS' : 'FAIL',
  release_status: releaseBlockers.length === 0 && manualGates.length === 0 ? 'READY' : 'HOLD',
  graph: {
    primary_next: `${primaryNextCount}/${slugs.length}`,
    related: `${relatedCount}/${slugs.length * 2}`,
    reference_entries: referenceCount,
  },
  custom_thumbnail_alt_supported: customThumbnailAltSupported,
  structural_errors: structuralErrors,
  release_blockers: releaseBlockers,
  manual_gates: manualGates,
  articles,
};

const outArgIndex = process.argv.indexOf('--out');
if (outArgIndex !== -1) {
  const outPath = process.argv[outArgIndex + 1];
  if (!outPath) throw new Error('--out requires a path');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(`[journal-first10] structural=${report.structural_status} release=${report.release_status}`);
console.log(`[journal-first10] articles=${articles.length}/${slugs.length} primary_next=${primaryNextCount}/${slugs.length} related=${relatedCount}/${slugs.length * 2} references=${referenceCount}`);
console.log(`[journal-first10] release_blockers=${releaseBlockers.length} manual_gates=${manualGates.length}`);
for (const blocker of releaseBlockers) {
  console.log(`BLOCKER ${blocker.code}${blocker.slug ? ` ${blocker.slug}` : ''}: ${blocker.detail}`);
}
for (const error of structuralErrors) {
  console.error(`ERROR ${error.code}${error.slug ? ` ${error.slug}` : ''}: ${error.detail}`);
}

if (structuralErrors.length > 0) process.exit(1);
