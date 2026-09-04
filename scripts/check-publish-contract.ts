import assert from 'node:assert/strict';
import { buildFrontmatter } from '../functions/lib/post-format';

const basePost = {
  title: 'Contract test',
  description: 'Publisher frontmatter contract test',
  category: 'doctor-column',
  slug: 'contract-test',
  status: 'draft',
  tags: [],
  published_at: '2026-09-04T00:00:00.000Z',
};

const publicArtifact = buildFrontmatter(basePost);
assert.match(
  publicArtifact,
  /\ndraft: false\n/,
  'A publish/export artifact must not inherit draft=true from the DB workflow status.',
);

const explicitDraftArtifact = buildFrontmatter(basePost, { draft: true });
assert.match(
  explicitDraftArtifact,
  /\ndraft: true\n/,
  'A caller must still be able to explicitly create a draft-only artifact.',
);

const publishedArtifact = buildFrontmatter({ ...basePost, status: 'published' });
assert.match(publishedArtifact, /\ndraft: false\n/);

console.log('Publisher frontmatter contract: OK');
