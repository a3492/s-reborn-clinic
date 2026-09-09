# Experience Content Contract v0.1

Status: **draft contract for implementation after validation; not a final IA schema**

## Purpose

Define a stable content-facing interface between editorial sources, CMS/storage, retrieval, and the website Experience layer. The contract deliberately avoids binding the frontend to the current Notion database shape, Markdown frontmatter, or any one future CMS.

## ContentRecord

Required identity and publication fields:

- `id`: stable opaque content ID. Never derive relational identity only from title.
- `slug`: current public slug.
- `title`: reviewed public title.
- `description`: reviewed public summary/SEO description.
- `status`: `draft | review | scheduled | published | archived`.
- `language`: BCP-47 style language code.
- `published_at`: nullable ISO timestamp.
- `updated_at`: ISO timestamp.

Experience fields:

- `editorial_pillar`: one primary editorial voice/category.
- `reader_intents`: zero or more validated user-intent tags.
- `medical_domains`: zero or more concern/domain tags.
- `reader_situations`: short natural-language situations users may identify with.
- `core_thesis`: reviewed statement of what the content actually supports.
- `search_summary`: concise retrieval-oriented synopsis; must not strengthen the reviewed claim.
- `content_role`: e.g. `question | case | principle | decision | viewpoint | guide`.
- `evidence_state`: editorial evidence/review provenance, not a substitute for medical review.

Discovery fields:

- `search_terms`: editorial synonyms/aliases only. Real participant phrases are appended only after validated collection.
- `procedure_names`: normalized procedure/device/product terms when applicable.
- `questions_answered`: reviewed questions that the article directly addresses.
- `questions_adjacent`: related questions for which the article may be Partial rather than Strong.

Presentation fields:

- `hero_asset_id`: nullable asset reference.
- `hero_alt`: nullable reviewed alt text.
- `card_summary`: nullable short display summary.
- `author_id`: stable author reference where applicable.

Safety/provenance fields:

- `medical_review_status`: explicit review state.
- `medical_reviewed_at`: nullable timestamp.
- `source_provenance`: internal provenance/reference summary.
- `claim_limitations`: explicit boundaries that downstream copy/retrieval must preserve.

## RelationEdge

Every relation is an edge, not a duplicated array with no provenance.

Required:

- `id`
- `source_content_id`
- `target_content_id`
- `relation_type`: `primary_next | related`
- `branch_type`: `question | decision | principle | clinical_reasoning | case | viewpoint | other`
- `reason`: human-readable editorial reason.
- `priority`: integer or ordered rank.
- `provenance`: `manual | suggested | approved_suggestion`.
- `status`: `active | review | archived`.
- `reviewed_at`

Rules:

1. `primary_next` must remain editorially overridable.
2. Automatic recommendation may add candidates but must not silently erase a curated primary-next edge.
3. No active edge may point to itself.
4. A target must exist and be eligible for the surface where the edge is rendered.
5. Recommendation ranking and relation meaning are separate concerns.

## Search coverage contract

Retrieval relevance and answer coverage are separate outputs.

- `Strong`: reviewed content directly addresses the submitted question within its claim boundaries.
- `Partial`: a relevant reviewed item exists but does not directly resolve the question.
- `No Direct`: the reviewed corpus does not contain a direct answer.

A high semantic similarity score is never sufficient by itself to promote Partial/No Direct to Strong.

## Source adapters

Adapters may translate from:

- Markdown/frontmatter
- Notion
- Supabase/Postgres
- future CMS

into this normalized contract. Source-specific fields remain outside the Experience API unless explicitly mapped.

## Non-goals before Human Gate

- final navigation taxonomy
- final retrieval/ranking algorithm
- final recommendation personalization
- final homepage module order
- automatic medical-answer generation
