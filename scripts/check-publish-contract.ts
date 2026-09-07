import assert from 'node:assert/strict';
import { buildFrontmatter, buildPublicPath } from '../functions/lib/post-format';

const basePost = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Contract test',
  description: 'Publisher frontmatter contract test',
  category: 'doctor-column',
  slug: 'contract-test',
  status: 'draft',
  tags: [],
  published_at: '2026-09-04T00:00:00.000Z',
  locale: 'ko',
  content_type: 'article',
  source_system: 'notion',
  source_external_id: 'notion-page-123',
  source_version: '2026-09-07T00:00:00.000Z',
  source_hash: 'sha256-example',
  content_version: 3,
};

const publicArtifact = buildFrontmatter(basePost);
assert.match(
  publicArtifact,
  /\ndraft: false\n/,
  'A publish/export artifact must not inherit draft=true from the DB workflow status.',
);
assert.match(publicArtifact, /content_id: "11111111-1111-4111-8111-111111111111"/);
assert.match(publicArtifact, /locale: "ko"/);
assert.match(publicArtifact, /content_type: "article"/);
assert.match(publicArtifact, /source_system: "notion"/);
assert.match(publicArtifact, /source_external_id: "notion-page-123"/);
assert.match(publicArtifact, /content_version: 3/);
assert.match(publicArtifact, /public_path: "\/blog\/doctor-column\/contract-test\/"/);
assert.equal(buildPublicPath(basePost), '/blog/doctor-column/contract-test/');
assert.equal(
  buildPublicPath({ ...basePost, category: 'doctor-ai', subcategory: 'workflow' }),
  '/doctor-ai-academy/workflow/contract-test/',
);

const explicitDraftArtifact = buildFrontmatter(basePost, { draft: true });
assert.match(
  explicitDraftArtifact,
  /\ndraft: true\n/,
  'A caller must still be able to explicitly create a draft-only artifact.',
);

const publishedArtifact = buildFrontmatter({ ...basePost, status: 'published' });
assert.match(publishedArtifact, /\ndraft: false\n/);

const legacyArtifact = buildFrontmatter({
  title: 'Legacy file-only contract',
  description: 'Legacy content may not have a Supabase UUID yet.',
  category: 'doctor-column',
  slug: 'legacy-contract',
  status: 'draft',
  tags: [],
  published_at: '2026-09-04T00:00:00.000Z',
});
assert.doesNotMatch(legacyArtifact, /content_id:/);
assert.match(legacyArtifact, /locale: "ko"/);
assert.match(legacyArtifact, /source_system: "manual"/);

console.log('Publisher frontmatter + canonical content identity contract: OK');
