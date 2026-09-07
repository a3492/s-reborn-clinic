# Gate 0 Supabase production reconciliation

Production migration history and the live schema diverged before this audit. Historical migrations must not be replayed blindly.

## Production baseline before reconciliation

- project: `s-reborn-clinic`
- status after restore: `ACTIVE_HEALTHY`
- recorded migration history before this work: only `20260403_admin_phase1`
- public tables before reconciliation: 8
- exact row counts before reconciliation:
  - `admin_profiles`: 1
  - `posts`: 0
  - `post_revisions`: 0
  - `audit_logs`: 0
  - `media_assets`: 0
  - `publish_jobs`: 0
  - `site_settings`: 0
  - `consult_requests`: 0
- auth users: 1
- the single Auth user is mapped to the single `admin_profiles` row and the role is in the owner/editor set
- storage buckets / objects: 0 / 0
- deployed Supabase Edge Functions: 0
- repo Edge Functions: 7
- `vector`, `pg_cron`, `pg_net`: not installed

Do not use Supabase `list_tables.rows` or `pg_stat_user_tables` as an exact data count immediately after project restore; those statistics were stale during this audit. Exact `COUNT(*)` queries were used for preservation checks.

## Applied production migrations

### `20260906140618_gate0_production_reconciliation.sql`

Applied successfully to production and codified under `supabase/migrations/` with the exact Supabase migration version.

It restores only capabilities already referenced by current `main`:

- Journal/editorial fields on `posts`
- public site-settings read policy
- post views with RPC-only write
- post reactions
- comments + private comment contact storage
- bookmarks
- glossary schema only
- FAQ schema only
- disclaimer schema only
- title A/B test schema and RPC counters
- Postgres full-text `search_vector`
- fixed `search_path` for existing public helper/trigger functions

Deliberately excluded:

- pgvector / `posts.embedding`
- `match_posts`
- `embed-post`
- pg_cron / pg_net
- `interaction_events`
- editorial seed data

### `20260907031345_gate0_least_privilege_hardening.sql`

Applied successfully after a production `BEGIN ... ROLLBACK` dry-run.

It:

- removes unnecessary anon access from admin/internal tables
- preserves anon `INSERT` for `consult_requests` while removing anon read/update/delete
- makes the `comment_contacts` client deny contract explicit
- optimizes `admin_profiles` RLS auth lookup
- consolidates duplicate permissive policies on `comments` and `post_reactions`
- adds covering indexes for foreign keys flagged by Supabase advisor
- removes one exact duplicate `consult_requests(created_at DESC)` index

## Privacy correction

The comment UI labels email as private. Historical code could have placed `author_email` on a comment row that public clients read and receive through Realtime.

The current contract is:

- public comment content → `comments`
- optional private email → `comment_contacts`
- `comment_contacts`: no anon/authenticated Data API access
- server service-role API is the writer

## Verification evidence

Both production migrations were dry-run against the live schema before application.

After application:

- Auth users: 1 — preserved
- `admin_profiles`: 1 — preserved
- Auth ↔ admin mapping: 1 — preserved
- owner/editor mapping: 1 — preserved
- new tables: RLS enabled
- `comment_contacts`: anon/authenticated read and write blocked
- `comments`: Realtime enabled without email-bearing columns
- `post_views`: anon direct INSERT/UPDATE blocked
- `increment_post_view`: anon RPC smoke test passed; test row removed
- Journal/editorial `posts` columns present
- existing and new helper functions have fixed `search_path`
- unnecessary anon SELECT on admin/internal tables removed
- `consult_requests`: anon INSERT preserved, anon SELECT removed
- comments authenticated SELECT permissive-policy count: 1
- reactions authenticated INSERT/DELETE permissive-policy count: 1 each
- advisor-flagged foreign-key indexes present
- exact duplicate consult index removed

## Advisor status after hardening

### Security

Resolved/reduced:

- mutable function `search_path` warnings
- anon GraphQL discoverability for internal admin/audit/media/publish/revision/consult tables
- `comment_contacts` no-policy informational warning through an explicit deny policy

Intentionally remaining:

- public-content tables exposed to anon because the website reads them publicly
- public counter RPCs (`increment_post_view`, A/B counters) are intentionally callable and therefore still appear as `SECURITY DEFINER` exposure warnings
- authenticated GraphQL visibility remains for tables used by authenticated reader/admin flows; RLS still determines row access

Operational follow-up outside this migration:

- Supabase Auth leaked-password protection is still disabled and should be enabled in Auth settings when available

### Performance

Resolved:

- unindexed foreign-key warnings
- `admin_profiles` auth RLS initplan warning
- multiple permissive policy warnings for comments/reactions
- duplicate consult index warning

Remaining entries are `unused_index` INFO notices. Production tables are effectively empty, so these are not evidence that the indexes are unnecessary yet; do not remove them before real traffic/query plans exist.

## Next gate

Database Gate 0 is now production-applied and verified.

Next sequence:

1. latest PR #16 validation PASS
2. merge PR #16 so repository history matches production migration history
3. restore/verify GitHub build-time `PUBLIC_SUPABASE_*` values without exposing secrets
4. restore/verify Cloudflare runtime Supabase values without exposing secrets
5. run PR #15 fail-fast + post-deploy smoke gate
6. only after smoke PASS, proceed to Living Website OS interaction-event foundation / canonical content identity work
