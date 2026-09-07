-- IR-004 Canonical Content Identity
--
-- Goals:
-- 1) Keep public.posts.id as the immutable canonical content UUID.
-- 2) Keep slug as a mutable URL/editorial identifier, never as lineage identity.
-- 3) Add source lineage/version metadata for the Notion -> staging -> publish pipeline.
-- 4) Let legacy interaction tables carry post_id without breaking existing slug-based clients.
--
-- Verified production prerequisite (2026-09-07):
-- - current admin/publisher columns already exist on public.posts
-- - posts_status_check already allows draft/review/scheduled/published/archived
--
-- Safety:
-- - no table reset/recreate
-- - no existing post/editorial column drop/rename
-- - no visitor/session data copied into content-source metadata
-- - interaction post_id remains nullable for static legacy content with no Supabase posts row

-- -----------------------------------------------------------------------------
-- 1. Canonical content identity / source lineage
-- -----------------------------------------------------------------------------

alter table public.posts
  add column if not exists locale text not null default 'ko',
  add column if not exists content_type text not null default 'article',
  add column if not exists source_system text not null default 'manual',
  add column if not exists source_external_id text,
  add column if not exists source_version text,
  add column if not exists source_hash text,
  add column if not exists content_version bigint not null default 1,
  add column if not exists public_path text;

alter table public.posts drop constraint if exists posts_locale_length_check;
alter table public.posts
  add constraint posts_locale_length_check
  check (char_length(locale) between 2 and 35);

alter table public.posts drop constraint if exists posts_content_type_length_check;
alter table public.posts
  add constraint posts_content_type_length_check
  check (char_length(content_type) between 1 and 80);

alter table public.posts drop constraint if exists posts_source_system_length_check;
alter table public.posts
  add constraint posts_source_system_length_check
  check (char_length(source_system) between 1 and 80);

alter table public.posts drop constraint if exists posts_content_version_check;
alter table public.posts
  add constraint posts_content_version_check
  check (content_version >= 1);

create index if not exists idx_posts_locale
  on public.posts (locale);

create index if not exists idx_posts_content_type
  on public.posts (content_type);

-- A source record may legitimately have distinct localized derivatives, hence locale
-- participates in the uniqueness key.
create unique index if not exists idx_posts_source_external_locale_unique
  on public.posts (source_system, source_external_id, locale)
  where source_external_id is not null;

create unique index if not exists idx_posts_public_path_unique
  on public.posts (public_path)
  where public_path is not null;

comment on column public.posts.id is
  'Immutable canonical content UUID. Maps to content_id in Markdown/events/API contracts.';
comment on column public.posts.slug is
  'Mutable URL/editorial identifier. Do not use as immutable content lineage identity.';
comment on column public.posts.locale is
  'BCP47-style content locale identifier, e.g. ko, en, zh-Hant.';
comment on column public.posts.content_type is
  'Content family used by publication/discovery contracts. Editorial role remains separate.';
comment on column public.posts.source_system is
  'Editorial source system such as manual, notion, import, or api. Never stores visitor identity.';
comment on column public.posts.source_external_id is
  'Stable identifier in the source system, e.g. Notion page id.';
comment on column public.posts.source_version is
  'Version/revision identifier reported by the source system.';
comment on column public.posts.source_hash is
  'Hash of the normalized editorial source payload for change detection.';
comment on column public.posts.content_version is
  'Monotonic publish-content version used for idempotency. Workflow/status-only changes must not bump it.';
comment on column public.posts.public_path is
  'Last intended public URL path for this content version. Canonical identity remains posts.id.';

-- -----------------------------------------------------------------------------
-- 2. Attach canonical post identity to legacy interaction tables
-- -----------------------------------------------------------------------------

alter table public.post_views
  add column if not exists post_id uuid references public.posts (id) on delete set null;
alter table public.post_reactions
  add column if not exists post_id uuid references public.posts (id) on delete set null;
alter table public.comments
  add column if not exists post_id uuid references public.posts (id) on delete set null;
alter table public.bookmarks
  add column if not exists post_id uuid references public.posts (id) on delete set null;

-- post_views represents one aggregate counter per canonical post when post_id is known.
create unique index if not exists idx_post_views_post_id_unique
  on public.post_views (post_id)
  where post_id is not null;
create index if not exists idx_post_reactions_post_id
  on public.post_reactions (post_id)
  where post_id is not null;
create index if not exists idx_comments_post_id
  on public.comments (post_id)
  where post_id is not null;
create index if not exists idx_bookmarks_post_id
  on public.bookmarks (post_id)
  where post_id is not null;

-- Legacy clients still submit only slug. Fill post_id when that slug has a Supabase
-- content row. SECURITY DEFINER is limited to this deterministic lookup and the function
-- is not executable through the Data API roles.
create or replace function public.attach_interaction_post_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  interaction_slug text;
begin
  if new.post_id is not null then
    return new;
  end if;

  interaction_slug := nullif(to_jsonb(new) ->> 'slug', '');
  if interaction_slug is null then
    return new;
  end if;

  select p.id
  into new.post_id
  from public.posts p
  where p.slug = interaction_slug
  limit 1;

  return new;
end;
$$;

revoke all on function public.attach_interaction_post_id() from public, anon, authenticated;

drop trigger if exists trg_post_reactions_attach_post_id on public.post_reactions;
create trigger trg_post_reactions_attach_post_id
before insert or update of slug, post_id on public.post_reactions
for each row execute function public.attach_interaction_post_id();

drop trigger if exists trg_comments_attach_post_id on public.comments;
create trigger trg_comments_attach_post_id
before insert or update of slug, post_id on public.comments
for each row execute function public.attach_interaction_post_id();

drop trigger if exists trg_bookmarks_attach_post_id on public.bookmarks;
create trigger trg_bookmarks_attach_post_id
before insert or update of slug, post_id on public.bookmarks
for each row execute function public.attach_interaction_post_id();

-- Existing view callers still send p_slug. Resolve the UUID when a Supabase post exists;
-- static legacy Markdown with no posts row continues to work with post_id = null.
-- When a canonical post slug changes, update the UUID-bound counter instead of creating
-- a second counter for the same content.
create or replace function public.increment_post_view(p_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_count bigint;
  resolved_post_id uuid;
begin
  if p_slug is null or char_length(trim(p_slug)) < 1 or char_length(p_slug) > 400 then
    raise exception 'invalid slug';
  end if;

  select p.id
  into resolved_post_id
  from public.posts p
  where p.slug = p_slug
  limit 1;

  if resolved_post_id is not null then
    update public.post_views
    set post_slug = p_slug,
        view_count = view_count + 1,
        last_viewed_at = now()
    where post_id = resolved_post_id
    returning view_count into next_count;

    if found then
      return next_count;
    end if;
  end if;

  insert into public.post_views as pv (post_id, post_slug, view_count, last_viewed_at)
  values (resolved_post_id, p_slug, 1, now())
  on conflict (post_slug) do update
    set post_id = coalesce(pv.post_id, excluded.post_id),
        view_count = pv.view_count + 1,
        last_viewed_at = now()
  returning view_count into next_count;

  return next_count;
end;
$$;

revoke all on function public.increment_post_view(text) from public;
grant execute on function public.increment_post_view(text) to anon, authenticated;

comment on column public.post_views.post_id is
  'Canonical content UUID when resolvable. post_slug remains a URL snapshot/legacy lookup key.';
comment on column public.post_reactions.post_id is
  'Canonical content UUID when available. slug remains the interaction-time URL snapshot.';
comment on column public.comments.post_id is
  'Canonical content UUID when available. slug remains the comment-time URL snapshot.';
comment on column public.bookmarks.post_id is
  'Canonical content UUID when available. slug remains the bookmark-time URL snapshot.';
