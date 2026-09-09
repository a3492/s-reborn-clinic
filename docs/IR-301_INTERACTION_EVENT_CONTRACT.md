# IR-301 Interaction Event Contract

Status: **Implemented on branch — migration and smoke prepared / non-production DB execution pending**

This contract adds an append-only event stream without replacing existing aggregate/current-state tables.

## 1. Compatibility rule

Existing behavior remains canonical for its UI during rollout:

- `post_views` — view aggregate
- `post_reactions` — current reaction state
- `bookmarks` — signed-in bookmark state
- local bookmark storage — anonymous bookmark state
- `comments` — moderated comment records
- report storage/API — correction reports

`interaction_events` is an additional downstream intelligence stream. Event write failure MUST NOT fail or roll back the primary visitor action.

## 2. Event envelope v1

Required logical fields:

| Field | Contract |
| --- | --- |
| `event_id` | client-generated UUID, primary key / dedupe identity |
| `event_name` | allow-listed v1 event name |
| `event_version` | integer, currently `1` |
| `occurred_at` | client occurrence timestamp |
| `received_at` | database receive timestamp, server default `now()` |
| `content_id` | nullable canonical `posts.id`; DB resolves from slug when possible |
| `slug` | URL/editorial snapshot at event time |
| `public_path` | browser path snapshot |
| `page_type` | e.g. `article`, `bookmarks`, `search` |
| `session_id` | pseudonymous reader session ID; same key already used by reactions |
| `locale` | page/content locale |
| `source` | default `web` |
| `metadata` | bounded JSON object; no raw clinical/personal narrative |

Initial v1 intentionally does **not** require a durable visitor/user profile ID. `session_id` is sufficient for the first editorial intelligence pilot and reduces unnecessary identity collection.

## 3. Initial event names

- `article.viewed`
- `article.engaged`
- `article.completed`
- `article.reacted`
- `article.bookmarked`
- `search.executed`
- `search.no_result`
- `search.result_clicked`
- `related.clicked`
- `primary_next.clicked`
- `question.submitted`
- `comment.submitted`
- `error.reported`

Adding a new event name is a contract change. Do not silently overload `metadata` to create hidden event types.

## 4. Implemented branch slices

Implemented on `feat/ir301-interaction-event-client`:

- article view — once per browser session + slug
- engaged — after 10 visible seconds
- completed — after 90% article consumption threshold
- automatic/curated related click
- curated primary-next click
- reaction add/remove — only after current-state mutation succeeds
- bookmark add/remove — only after bookmark mutation/local-state change succeeds when Supabase is available
- comment submit — server-side event append only after durable comment insert and optional private contact handling succeed
- error report — server-side event append only after durable `post_reports` insert succeeds
- search execute — append only after a successful full-text or fallback search response
- search no-result — append only when the successful search returns zero rows
- search result click — carries canonical result `posts.id`, slug snapshot, result rank, result count, and search strategy

Search event metadata deliberately excludes the raw query. Only bounded derived metrics are recorded: query character count, query token count, result count, search strategy, execution duration, and result rank where applicable.

For comment/report server-side dual-write, the shared pseudonymous reader session ID is bridged through narrowly scoped SameSite cookies for `/api/comments` and `/api/report`; it is not made site-wide. Raw comment body, email, report description, IP address, and Turnstile token are excluded from generic event metadata.

## 5. Database security contract for the pending migration

The migration is generated with `supabase migration new ir301_interaction_events`; do not invent or rename its timestamped filename.

Required database behavior:

1. Create `public.interaction_events` with RLS enabled.
2. `anon` and `authenticated` receive **INSERT only**.
3. Do not grant `SELECT`, `UPDATE`, or `DELETE` to browser roles.
4. `event_name` is constrained to the v1 allow-list.
5. `event_version` is constrained to `1` initially.
6. `metadata` must be a JSON object and bounded (target <= 8 KiB serialized).
7. `session_id`, `slug`, `page_type`, `locale`, `source`, and `public_path` have explicit length bounds.
8. `content_id` is nullable FK to `posts.id`.
9. Before insert, DB discards client-supplied `content_id` and resolves it from the current `posts.slug` match. A browser cannot forge canonical content identity, and public clients do not need `posts` SELECT access for event recording.
10. Events are append-only for browser roles.
11. No raw email, comment body, question narrative, diagnosis, treatment detail, search query, IP address, or Turnstile token belongs in generic event `metadata`.

## 6. Dual-write semantics

A visitor action has two independent outcomes:

1. Primary state/aggregate mutation
2. Best-effort event append

For state-changing actions such as reactions/bookmarks/comments/reports, append the event only after primary success. If event append fails, retain the successful primary action and surface event-pipeline health separately.

`article.viewed/engaged/completed` and search instrumentation are analytics-only and therefore have no primary state dependency beyond successful rendering/search execution.

## 7. Canonical identity

IR-004 remains authoritative:

- `posts.id` = immutable content identity
- `slug` / `public_path` = mutable snapshots

Event rows therefore retain both `content_id` and the historical slug/path snapshot. Editorial intelligence must group by `content_id` when available and fall back to slug only for legacy file-only content.

## 8. Exit criteria for IR-301 foundation

- [x] shared reader session contract
- [x] append-only client writer
- [x] article viewed/engaged/completed instrumentation
- [x] related/primary-next click instrumentation
- [x] reaction dual-write
- [x] bookmark dual-write
- [x] comment/report server-side dual-write
- [x] search execute/no-result/result-click instrumentation without raw query capture
- [x] CLI-generated migration
- [x] transactional RLS / grants smoke script
- [x] canonical `content_id` trigger smoke assertion
- [x] CI contract assertions for event allow-list, best-effort semantics, migration least privilege, feedback success paths, and search privacy
- [ ] disposable local/preview DB migration apply + transactional RLS/grants/canonical smoke execution
- [ ] migration security advisor verification after apply
- [ ] production apply + live event smoke
