# Question Intake Contract v0.1

Status: **design contract only; production collection backend not active**

## Purpose

Question Intake captures unanswered or under-covered user questions for editorial review. It is **not** a live medical-consultation endpoint and must not generate personalized medical answers from unreviewed input.

## Required lifecycle

`submit -> privacy/safety screen -> normalize -> deduplicate/cluster -> reviewed-corpus coverage check -> disposition -> editorial review -> content/retrieval feedback`

## Raw record

Minimum fields:

- `raw_question_id`: opaque UUID.
- `submitted_at`: ISO timestamp.
- `question_raw`: verbatim user wording after immediate secret/identifier rejection rules.
- `source_surface`: e.g. `no_direct | partial | question_bar | article`.
- `language`.
- `consent_scope`: what the user was told the submission will be used for.
- `privacy_state`: `accepted | rejected_sensitive | needs_review`.
- `moderation_state`: `new | triaged | duplicate | accepted_editorial | rejected | resolved_by_existing_content`.

Do not collect by default:

- real name
- phone/email
- chart/medical-record identifiers
- resident/registration numbers
- images of medical records
- passwords/tokens
- unnecessary individual clinical history

## Preserve raw language

`question_raw` and any normalized derivative are separate fields.

Normalization may:

- normalize whitespace
- map known synonyms
- generate embeddings/features
- attach editorial tags

Normalization must not overwrite the original phrasing. The raw language is valuable for retrieval, UI copy, and content-gap research.

## Coverage triage

Every accepted question receives a reviewed-corpus disposition:

- `STRONG_EXISTING`: reviewed content directly covers the question.
- `PARTIAL_EXISTING`: adjacent content exists but is not a direct answer.
- `NO_DIRECT`: no reviewed direct answer.
- `OUT_OF_SCOPE`: outside the site's intended editorial domain.
- `SENSITIVE_REVIEW`: content cannot be safely handled in the normal editorial queue.

The system may route to reviewed content, but must never pretend Partial/No Direct is a direct personalized answer.

## Deduplication model

Keep stable separate IDs:

- `raw_question_id`: each original submission.
- `question_cluster_id`: normalized recurring theme.
- `resulting_content_id`: nullable mature content created or updated as a result.

This lets many real phrasings improve one editorial cluster without erasing provenance.

## Editorial priority signals

Allowed signals include:

- recurrence count
- high-frequency user vocabulary
- current content gap
- safety importance
- strategic domain priority
- whether existing Partial results repeatedly frustrate users

Do not use sensitive attributes or infer medical diagnoses for prioritization.

## Response behavior by coverage state

### Strong
Show reviewed content and clarify that it is general information, not individualized diagnosis/treatment.

### Partial
State that related content exists but does not directly answer the submitted question. Offer the related content and optionally accept the question into editorial intake.

### No Direct
State clearly that the reviewed corpus does not currently contain a direct answer. Offer editorial submission. Do not auto-generate a definitive medical answer.

## Retention and deletion

Before production implementation, define:

- retention period for raw questions
- deletion mechanism
- audit access
- who can view raw vs normalized data
- how accidental sensitive data are purged

Until these are explicit, prototype localStorage intake must not be treated as the production persistence model.

## Success criteria

- No silent upgrade from Partial/No Direct to Strong.
- Editorial team can trace a cluster back to de-identified verbatim language.
- Duplicate questions consolidate without losing frequency.
- Resulting reviewed content can close the loop back into retrieval coverage.
