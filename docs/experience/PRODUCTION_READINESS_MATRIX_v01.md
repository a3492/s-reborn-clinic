# Production Readiness Matrix v0.1

Status: **dependency map; not a release approval**

## Purpose

Prevent parallel work from being mistaken for permission to freeze user-facing architecture. This matrix distinguishes work that is safe now from work that depends on real visitor evidence.

## Lane A — Content / editorial

Current state:

- 30 mature reviewed/publication-waiting articles.
- 30/30 primary-next + related relations.
- 23/30 primary-next links cross editorial pillars.

Safe now:

- preserve reviewed content packages
- legacy inventory and reuse-state mapping
- hero/alt/crop readiness work in its dedicated visual lane
- thin-domain content expansion

Blocked/final later:

- changing taxonomy only to suit a speculative UI
- automatic recommendation that overrides curated relations

## Lane B — Human validation

Current blocker:

- `INTERNAL-P01-R2` real-phone instrumentation acceptance.

Then:

- H01-H05 minimum human batch.
- Green / Yellow / Red review.
- Yellow: narrow copy/hierarchy/prominence change + 3-5 retest.
- Red: reopen Home/Search entry comparison.

No final IA/navigation freeze before this lane yields evidence.

## Lane C — Experience data contract

Safe now:

- normalized `ContentRecord` contract
- explicit `RelationEdge` contract
- source adapter boundaries
- reviewed-coverage state semantics

After Human Gate:

- implement contract in production CMS/API
- determine which user-language fields are promoted into search metadata

## Lane D — Retrieval/search

Safe now:

- benchmark schema
- metric definitions
- false-Strong safety criteria
- candidate harness interfaces

Blocked until human queries exist:

- production ranking selection
- tuned thresholds
- final search-result prominence/order

Release evidence required:

- benchmark version
- lexical/dense/hybrid comparison
- False-Strong review
- known failure cases
- fallback behavior

## Lane E — Question Intake

Safe now:

- privacy/safety contract
- raw/cluster/content identifiers
- moderation states
- coverage disposition rules

Blocked until expectations + retention policy are validated:

- production persistence
- automated editorial promotion
- notification/follow-up promises

## Lane F — Analytics

Safe now:

- event dictionary and naming
- non-PII session identifiers
- funnel definitions
- QA assertions

After first behavior baseline:

- thresholds and alerting
- success/failure targets
- optimization decisions

Do not fix KPI thresholds before baseline data exist.

## Lane G — Responsive / accessibility / performance

Safe now:

- test matrix definition
- semantic HTML requirements
- keyboard/focus/contrast requirements
- image sizing/lazy-loading policy
- Core Web Vitals instrumentation plan

Final acceptance after stable Hi-Fi implementation:

- mobile/desktop cross-browser QA
- WCAG-oriented audit
- Lighthouse/Web Vitals evidence
- performance budget evidence

## Lane H — SEO / structured data / multilingual

Safe now:

- canonical/alternate policy
- metadata contract
- Article/FAQ structured-data ownership rules
- language/translation provenance model

Implementation finalization depends on stable routes and production content state.

## Lane I — Security / privacy / operations

Already parallel-blocked elsewhere:

- build-time/runtime environment contract must pass before merge/release.

Required before production release:

- secret/env gates
- runtime health smoke
- least-privilege service access
- privacy/retention policy for Question Intake and analytics
- rollback procedure
- backup/recovery expectations

## Gate summary

### Gate 0 — current

Allowed: contracts, inventory, scripts, isolated prototype, non-runtime documentation.

### Gate 1 — INTERNAL-P01-R2 Technical PASS

Allows: H01-H05 real human sessions.

### Gate 2 — Human Green/Yellow/Red

Green: Hi-Fi and production implementation can proceed without reopening core P1 structure.

Yellow: only narrow corrections first, then 3-5 retest.

Red: reopen Home/Search entry comparison; do not discard Content First principles.

### Gate 3 — Hi-Fi + production candidate

Requires responsive/accessibility/performance/SEO/security integration QA.

### Gate 4 — Release candidate

Requires env/runtime gates, content release evidence, analytics smoke, structured-data QA, multilingual QA where enabled, and rollback readiness.

## Progress accounting rule

Planning/contracts count as preparation, not as equivalent to deployed production implementation. Human validation and release hardening retain their own weight so documentation work cannot inflate the overall percentage unrealistically.
