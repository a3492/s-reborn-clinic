import fs from 'node:fs';
import path from 'node:path';

const entries = [
  'doctor-column/consultation-no-treatment',
  'doctor-column/filler-migration',
  'doctor-column/hifu-vs-radiofrequency',
  'doctor-column/laser-black-balloon',
  'doctor-column/sagging-lift-fill-reduce',
  'doctor-column/self-face-perception',
  'doctor-column/survivorship-bias',
  'doctor-column/weight-loss-face-aging',
  'doctor-column/when-not-to-reduce-facial-fat',
  'doctor-column/when-not-to-treat',
];

const distRoot = path.resolve(process.argv[2] || 'dist');
const publicRoot = fs.existsSync(path.join(distRoot, 'client')) ? path.join(distRoot, 'client') : distRoot;
const leaked = [];

for (const id of entries) {
  const candidates = [
    path.join(publicRoot, 'blog', id, 'index.html'),
    path.join(publicRoot, 'blog', `${id}.html`),
  ];
  if (candidates.some((candidate) => fs.existsSync(candidate))) leaked.push(id);
}

if (leaked.length) {
  console.error(`[journal-first10-public] FAIL: draft pages leaked into normal build: ${leaked.join(', ')}`);
  process.exit(1);
}

console.log(`[journal-first10-public] PASS: 0/${entries.length} staged drafts emitted by the normal public build`);
console.log(`[journal-first10-public] inspected output root: ${path.relative(process.cwd(), publicRoot) || '.'}`);
