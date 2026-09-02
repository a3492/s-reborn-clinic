-- Journal editorial series foundation
--
-- Markdown Content Collection이 최종 공개 소스인 현재 publish flow는 유지하면서,
-- 관리자 posts 테이블에서도 편집 리드·명시적 이어읽기·근거 메타데이터를 보존한다.
-- 기존 `series` 컬럼은 20260407_posts_series_column.sql에서 이미 추가되어 있으므로 재정의하지 않는다.

alter table public.posts
  add column if not exists series_order integer,
  add column if not exists lead text,
  add column if not exists thumbnail_label text,
  add column if not exists content_role text
    check (content_role is null or content_role in ('entrance', 'trust', 'brand', 'practical', 'connector')),
  add column if not exists primary_next_slug text,
  add column if not exists related_slugs text[] not null default '{}',
  add column if not exists reference_links jsonb not null default '[]'::jsonb,
  add column if not exists case_disclosure text,
  add column if not exists social_hook text,
  add column if not exists content_updated_at timestamptz;

create index if not exists idx_posts_primary_next_slug
  on public.posts (primary_next_slug)
  where primary_next_slug is not null;

comment on column public.posts.series is
  'Blog series name. Journal public editorial series also reuse this existing field.';
comment on column public.posts.primary_next_slug is
  'Editor-selected next article slug for semantic reading flow; independent from chronological series navigation.';
comment on column public.posts.related_slugs is
  'Editor-selected related Blog slugs. Journal UI normally renders the first two.';
comment on column public.posts.reference_links is
  'Evidence/reference metadata array: [{label,url,source_type?,note?}].';
comment on column public.posts.case_disclosure is
  'Public disclosure for composite/non-identifiable case narratives.';
