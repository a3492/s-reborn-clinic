# Usability -> Retrieval Handoff v0.1

Status: **prepared; activation waits for valid human sessions**

## Why

The prototype currently uses deterministic corpus-bound phrase routing. That is appropriate for Experience discovery but must not be promoted directly into production retrieval. Real participant language collected during H01+ is the bridge to a production benchmark.

## Inputs after Human Gate collection begins

Per de-identified query/event:

- `query_id`: opaque ID.
- `session_code`: non-identifying test code.
- `task_id`: nullable; null for free-form questions.
- `query_raw`: exact participant wording.
- `query_normalized`: lowercase/spacing/obvious typo-normalized derivative; never replace `query_raw`.
- `source`: `task_search | question_bar | question_intake | free_exploration`.
- `expected_coverage`: `Strong | Partial | No Direct`, assigned after review.
- `relevant_content_ids`: reviewed relevance set.
- `direct_answer_content_ids`: subset that actually supports Strong.
- `notes`: adjudication rationale without personal medical data.

## Benchmark split

Do not tune and judge on the same tiny set.

1. Seed set: existing five representative tasks + curated boundary cases. Used only for regression.
2. Human-language development set: earliest valid participant queries; used to design candidate retrieval.
3. Holdout set: later participant queries kept untouched until candidate comparison.

With very small n, report uncertainty and do not claim statistical superiority.

## Candidate families

Evaluate at minimum:

- lexical/BM25-style baseline
- dense semantic retrieval
- hybrid lexical + dense
- hybrid + reranker only if the simpler hybrid leaves material failure modes

The existing deterministic phrase boosts remain a prototype baseline, not a production candidate by default.

## Metrics

Relevance:

- Recall@3
- MRR
- nDCG@5

Safety/coverage:

- rank-1 direct-answer precision
- False-Strong rate
- No-Direct boundary recall
- Partial-vs-Strong confusion count

Experience:

- query coverage rate
- no-result/No-Direct rate
- median interactions after search to first relevant content

## False-Strong is a release blocker

Definition: a query is shown/treated as directly answered when reviewed content is only adjacent, incomplete, or absent.

Production retrieval cannot be selected only because Recall@3 is high. A candidate with lower False-Strong risk may be preferred even if conventional ranking metrics are slightly lower.

## Adjudication workflow

1. Preserve raw participant wording.
2. Remove identifiers or personal clinical details if accidentally captured.
3. Two conceptual judgments are made separately:
   - relevance: which content is useful?
   - coverage: does any reviewed content directly answer this question?
4. Record disagreements rather than forcing a silent label.
5. Use disagreements to refine editorial coverage definitions before tuning ranking.

## Output required before implementation PR

- benchmark dataset version
- candidate comparison table
- error taxonomy with at least top recurring failure modes
- selected candidate + why
- known failure cases
- Strong/Partial/No Direct threshold policy
- rollback/fallback behavior

## Freeze rule

Do not merge a production retrieval implementation until at least the first valid human batch exists and the benchmark includes actual user wording. Infrastructure interfaces may be prepared in advance, but ranking behavior remains unfrozen.
