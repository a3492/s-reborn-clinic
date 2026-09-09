import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
assert.match(explicitDraftArtifact, /\ndraft: true\n/);
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

// IR-101 static safety invariants. These intentionally fail CI if commit truth and
// verified-live truth are accidentally collapsed again.
const publisher = readFileSync(new URL('../functions/api/admin/publish.ts', import.meta.url), 'utf8');
const finalizer = readFileSync(new URL('../functions/api/admin/publish-finalize.ts', import.meta.url), 'utf8');
const scheduler = readFileSync(new URL('../supabase/functions/scheduled-publish/index.ts', import.meta.url), 'utf8');
const finalizeWorkflow = readFileSync(new URL('../.github/workflows/publish-live-finalize.yml', import.meta.url), 'utf8');

assert.match(publisher, /buildFrontmatter\(post, \{ draft: false \}\)/);
assert.match(publisher, /status: 'build_pending'/);
assert.match(publisher, /deploy_status: 'build_pending'/);
assert.doesNotMatch(
  publisher,
  /status:\s*'published'/,
  'Commit-stage publisher must never declare the post publicly published.',
);
assert.doesNotMatch(
  publisher,
  /triggerEmbedPost\(/,
  'Embedding must be a verified-live side effect, not a commit-stage side effect.',
);
assert.doesNotMatch(
  publisher,
  /notify-subscribers/,
  'Subscriber notification must occur only after verified-live finalization.',
);

assert.match(finalizer, /data-s-reborn-content-id/);
assert.match(finalizer, /data-s-reborn-content-version/);
assert.match(finalizer, /conclusion === 'success'/);
assert.match(finalizer, /status: 'published'/);
assert.match(finalizer, /deploy_status: 'live'/);
assert.match(finalizer, /triggerEmbedPost\(/);
assert.match(finalizer, /notify-subscribers/);

// Finalizer caller authentication must be GitHub Actions OIDC, not an arbitrary bearer token.
assert.match(finalizer, /https:\/\/token\.actions\.githubusercontent\.com/);
assert.match(finalizer, /\.well-known\/jwks/);
assert.match(finalizer, /crypto\.subtle\.verify/);
assert.match(finalizer, /EXPECTED_REPOSITORY_ID = '1200829432'/);
assert.match(finalizer, /repository_id/);
assert.match(finalizer, /workflow_ref/);
assert.match(finalizer, /event_name === 'workflow_run'/);
assert.match(finalizer, /ref_type === 'branch'/);
assert.match(finalizer, /OIDC_AUDIENCE/);
assert.match(finalizer, /X-GitHub-Token/);
assert.match(finalizer, /callerRunId/);
assert.match(finalizer, /EXPECTED_DEPLOY_WORKFLOW_PATH/);

assert.match(scheduler, /\.in\('deploy_status', \['idle', 'failed', 'rolled_back'\]\)/);
assert.match(scheduler, /contentVersion/);
assert.match(finalizeWorkflow, /workflow_run:/);
assert.match(finalizeWorkflow, /workflows: \["Deploy to Cloudflare Pages"\]/);
assert.match(finalizeWorkflow, /id-token: write/);
assert.match(finalizeWorkflow, /ACTIONS_ID_TOKEN_REQUEST_URL/);
assert.match(finalizeWorkflow, /ACTIONS_ID_TOKEN_REQUEST_TOKEN/);
assert.match(finalizeWorkflow, /OIDC_AUDIENCE: s-reborn-publish-finalizer/);
assert.match(finalizeWorkflow, /Authorization: Bearer \$\{OIDC_TOKEN\}/);
assert.match(finalizeWorkflow, /X-GitHub-Token: \$\{GITHUB_API_TOKEN\}/);
assert.doesNotMatch(
  finalizeWorkflow,
  /Authorization: Bearer \$\{GITHUB_API_TOKEN\}/,
  'github.token may prove deploy metadata via the GitHub API, but must not authenticate the finalizer caller.',
);

console.log('Publisher identity + IR-101 verified-live + OIDC finalizer contract: OK');
