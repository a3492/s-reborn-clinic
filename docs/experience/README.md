# S-Reborn Experience — Production-Prep Lane

Status: **pre-validation / non-runtime / no architecture freeze**

This directory prepares production contracts that are safe to build before the first valid human-usability batch is complete.

## Governing rules

- Content First -> Experience Second.
- P1 Hybrid is the preferred prototype, not final IA.
- Do not freeze navigation, recommendation, personalization, search ranking, or final CTA architecture before real behavior evidence.
- Search/Q&A is Existing Content First. Reviewed S-Reborn content is retrieved before an unanswered question is accepted into editorial intake.
- Strong / Partial / No Direct coverage states are safety semantics, not visual labels only.
- Curated `primary_next` and explicit relation meaning must remain preservable if automatic recommendation is introduced.
- No patient-identifiable or participant-identifiable data belongs in prototype analytics, Question Intake, benchmark corpora, or repository fixtures.

## Files

- `EXPERIENCE_CONTENT_CONTRACT_v01.md` — normalized content + relation contract independent of current Notion/frontend shapes.
- `USABILITY_TO_RETRIEVAL_HANDOFF_v01.md` — how real participant language becomes a retrieval benchmark after the Human Gate.
- `QUESTION_INTAKE_CONTRACT_v01.md` — privacy/safety/moderation/editorial lifecycle for unanswered questions.
- `PRODUCTION_READINESS_MATRIX_v01.md` — dependency-aware path from current prototype state to production release.
- `schemas/*.schema.json` — machine-readable draft contracts; documentation only until a later implementation PR adopts them.
- `scripts/audit-experience-readiness.mjs` — read-only inventory/audit. It must never rewrite content.

## Current blocking physical gate

`INTERNAL-P01-R3` must be run on a real mobile device against v0.3.2 after the navigation hotfix. After machine + manual Technical PASS, H01-H05 are the minimum first human batch. Contract work in this directory may continue in parallel, but no human-dependent field is declared validated until those sessions exist.
