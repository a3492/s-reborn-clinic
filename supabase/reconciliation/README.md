# Gate 0 Supabase production reconciliation

This directory is intentionally **not** `supabase/migrations/` yet.

Production migration history and the live schema diverged before this audit. Historical migrations must not be replayed blindly.

## Current production baseline

- project: `s-reborn-clinic`
- status after restore: `ACTIVE_HEALTHY`
- recorded migration history: only `20260403_admin_phase1`
- public tables before reconciliation: 8
- public rows: 0
- auth users: 1 — preserve
- storage buckets / objects: 0 / 0
- deployed Supabase Edge Functions: 0
- repo Edge Functions: 7
- `vector`, `pg_cron`, `pg_net`: not installed

## Candidate scope

`gate0_production_reconciliation.sql` restores only capabilities already referenced by current `main`:

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

It deliberately excludes:

- pgvector / `posts.embedding`
- `match_posts`
- `embed-post`
- pg_cron / pg_net
- `interaction_events`
- editorial seed data

## Privacy correction included

Current comment UI labels email as private, while the historical schema path could have placed `author_email` on a publicly readable comment row.

The candidate instead stores:

- public comment content → `comments`
- optional private email → `comment_contacts`

`comment_contacts` grants no access to `anon` or `authenticated`; the service-role server API is the only current writer.

## Dry-run evidence

The full candidate DDL was executed against the live production schema inside:

```sql
BEGIN;
-- candidate SQL
ROLLBACK;
```

Result: **PASS** — no DDL, RLS, grant, trigger, publication, or object-name conflicts were raised. The transaction was rolled back, so production schema was unchanged by the dry-run.

## Before production apply

1. PR Validation must pass on the latest head.
2. Review changed files and confirm no accidental vector/cron/seed work entered scope.
3. Apply the candidate as a **new reconciliation migration**, not by replaying historical migrations.
4. Immediately verify tables, RLS, grants, RPC execution and preserved Auth user count.
5. Re-run Supabase security and performance advisors.
6. Only after DB capability verification, restore GitHub `PUBLIC_SUPABASE_*` and Cloudflare runtime env.
7. Then merge PR #15 and require its post-deploy smoke gate to pass.
