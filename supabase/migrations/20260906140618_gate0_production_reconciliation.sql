-- CANDIDATE SQL ONLY — intentionally not under supabase/migrations yet.
--
-- Purpose:
-- Reconcile the current live production schema with capabilities already used by main,
-- without replaying historical migrations whose history no longer matches production.
--
-- Rules:
-- - additive / idempotent where practical
-- - preserve existing auth users and existing public tables
-- - no vector / embedding / pg_cron / pg_net in Gate 0
-- - no seed editorial content
-- - apply only after live-schema dry-run and review

-- -----------------------------------------------------------------------------
-- 1. Existing function hardening
-- -----------------------------------------------------------------------------

alter function public.is_admin() set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.set_media_assets_updated_at() set search_path = '';
alter function public.set_site_settings_updated_at() set search_path = '';
alter function public.set_consult_requests_updated_at() set search_path = '';

-- -----------------------------------------------------------------------------
-- 2. Admin post schema ↔ Journal publishing contract
-- -----------------------------------------------------------------------------

alter table public.posts
  add column if not exists series text,
  add column if not exists series_order integer,
  add column if not exists lead text,
  add column if not exists thumbnail_label text,
  add column if not exists content_role text,
  add column if not exists primary_next_slug text,
  add column if not exists related_slugs text[] not null default '{}',
  add column if not exists reference_links jsonb not null default '[]'::jsonb,
  add column if not exists case_disclosure text,
  add column if not exists social_hook text,
  add column if not exists content_updated_at timestamptz;

create index if not exists idx_posts_series
  on public.posts (series)
  where series is not null;

create index if not exists idx_posts_primary_next_slug
  on public.posts (primary_next_slug)
  where primary_next_slug is not null;

-- Keep the constraint separate so a pre-existing compatible column does not block the
-- reconciliation. Add it only if no constraint with this name exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.posts'::regclass
      and conname = 'posts_content_role_check'
  ) then
    alter table public.posts
      add constraint posts_content_role_check
      check (
        content_role is null
        or content_role in ('entrance', 'trust', 'brand', 'practical', 'connector')
      );
  end if;
end
$$;

comment on column public.posts.series is
  'Blog series name. Journal public editorial series reuse this field.';
comment on column public.posts.primary_next_slug is
  'Editor-selected semantic next article slug, independent from chronological series navigation.';
comment on column public.posts.related_slugs is
  'Editor-selected related Blog slugs.';
comment on column public.posts.reference_links is
  'Evidence/reference metadata array.';
comment on column public.posts.case_disclosure is
  'Public disclosure for composite/non-identifiable case narratives.';

-- Existing public settings were created manually outside migration history.
drop policy if exists "site_settings_public_anon_select" on public.site_settings;
create policy "site_settings_public_anon_select"
on public.site_settings
for select
to anon
using (key in ('site_meta', 'homepage', 'about_page', 'social_links'));

grant select on public.site_settings to anon;

-- -----------------------------------------------------------------------------
-- 3. Post views — public read + RPC-only write
-- -----------------------------------------------------------------------------

create table if not exists public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null unique,
  view_count bigint not null default 0 check (view_count >= 0),
  last_viewed_at timestamptz not null default now(),
  constraint post_views_slug_length check (char_length(post_slug) between 1 and 400)
);

alter table public.post_views enable row level security;

drop policy if exists "post_views_public_select" on public.post_views;
create policy "post_views_public_select"
on public.post_views
for select
to anon, authenticated
using (true);

revoke all on public.post_views from anon, authenticated;
grant select on public.post_views to anon, authenticated;

create or replace function public.increment_post_view(p_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_count bigint;
begin
  if p_slug is null or char_length(trim(p_slug)) < 1 or char_length(p_slug) > 400 then
    raise exception 'invalid slug';
  end if;

  insert into public.post_views as pv (post_slug, view_count, last_viewed_at)
  values (p_slug, 1, now())
  on conflict (post_slug) do update
    set view_count = pv.view_count + 1,
        last_viewed_at = now()
  returning view_count into next_count;

  return next_count;
end;
$$;

revoke all on function public.increment_post_view(text) from public;
grant execute on function public.increment_post_view(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Reactions — compatibility with current UI, explicitly low-trust anonymous signal
-- -----------------------------------------------------------------------------

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  reaction text not null,
  session_id text,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_reactions_one_identity check (
    (user_id is not null and session_id is null)
    or (user_id is null and session_id is not null)
  ),
  constraint post_reactions_slug_length check (char_length(slug) between 1 and 400),
  constraint post_reactions_session_length check (
    session_id is null or char_length(session_id) between 1 and 128
  ),
  constraint post_reactions_known_type check (
    reaction in ('helpful', 'like', 'bookmark', 'curious', 'unclear')
  )
);

create unique index if not exists post_reactions_unique_anon
  on public.post_reactions (slug, reaction, session_id)
  where user_id is null and session_id is not null;

create unique index if not exists post_reactions_unique_user
  on public.post_reactions (slug, reaction, user_id)
  where user_id is not null;

create index if not exists idx_post_reactions_slug
  on public.post_reactions (slug);

alter table public.post_reactions enable row level security;

drop policy if exists "post_reactions_select_public" on public.post_reactions;
create policy "post_reactions_select_public"
on public.post_reactions for select to anon, authenticated
using (true);

drop policy if exists "post_reactions_anon_insert" on public.post_reactions;
create policy "post_reactions_anon_insert"
on public.post_reactions for insert to anon
with check (user_id is null and session_id is not null);

drop policy if exists "post_reactions_anon_delete" on public.post_reactions;
create policy "post_reactions_anon_delete"
on public.post_reactions for delete to anon
using (user_id is null and session_id is not null);

drop policy if exists "post_reactions_reader_insert" on public.post_reactions;
create policy "post_reactions_reader_insert"
on public.post_reactions for insert to authenticated
with check (user_id = (select auth.uid()) and session_id is null);

drop policy if exists "post_reactions_reader_delete" on public.post_reactions;
create policy "post_reactions_reader_delete"
on public.post_reactions for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "post_reactions_admin_all" on public.post_reactions;
create policy "post_reactions_admin_all"
on public.post_reactions for all to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.post_reactions from anon, authenticated;
grant select, insert, delete on public.post_reactions to anon, authenticated;

comment on table public.post_reactions is
  'Reader reaction rows. Anonymous session_id is client supplied and should be treated as a low-trust signal.';

-- -----------------------------------------------------------------------------
-- 5. Comments — public content separated from private contact information
-- -----------------------------------------------------------------------------

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  parent_id uuid references public.comments (id) on delete cascade,
  author_name text not null,
  body text not null,
  is_approved boolean not null default false,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint comments_slug_length check (char_length(slug) between 1 and 400),
  constraint comments_author_name_length check (char_length(trim(author_name)) between 1 and 50),
  constraint comments_body_length check (char_length(body) between 1 and 500)
);

create index if not exists idx_comments_slug_approved_created
  on public.comments (slug, is_approved, created_at);
create index if not exists idx_comments_user_created
  on public.comments (user_id, created_at desc)
  where user_id is not null;
create index if not exists idx_comments_parent
  on public.comments (parent_id)
  where parent_id is not null;

alter table public.comments enable row level security;

drop policy if exists "comments_public_approved" on public.comments;
create policy "comments_public_approved"
on public.comments for select to anon, authenticated
using (is_approved = true);

drop policy if exists "comments_select_own" on public.comments;
create policy "comments_select_own"
on public.comments for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "comments_admin_all" on public.comments;
create policy "comments_admin_all"
on public.comments for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Browser clients may read approved/own rows, but all writes currently go through
-- /api/comments with the service-role credential.
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant update, delete on public.comments to authenticated;
grant all on public.comments to service_role;

create table if not exists public.comment_contacts (
  comment_id uuid primary key references public.comments (id) on delete cascade,
  author_email text not null,
  created_at timestamptz not null default now(),
  constraint comment_contacts_email_length check (char_length(author_email) between 3 and 320)
);

alter table public.comment_contacts enable row level security;
revoke all on public.comment_contacts from anon, authenticated;
grant all on public.comment_contacts to service_role;

comment on table public.comment_contacts is
  'Private optional contact data for comments. Never expose to anon/authenticated Data API roles.';

-- The comments table intentionally contains no email column, so Realtime row payloads
-- cannot leak optional contact email.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'comments'
     ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 6. Reader bookmarks
-- -----------------------------------------------------------------------------

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (user_id, slug),
  constraint bookmarks_slug_length check (char_length(slug) between 1 and 400)
);

create index if not exists idx_bookmarks_user_created
  on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

drop policy if exists "bookmarks_own_rows" on public.bookmarks;
create policy "bookmarks_own_rows"
on public.bookmarks
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.bookmarks from anon, authenticated;
grant select, insert, update, delete on public.bookmarks to authenticated;

-- -----------------------------------------------------------------------------
-- 7. Glossary — schema only; no seed content in infrastructure migration
-- -----------------------------------------------------------------------------

create table if not exists public.glossary (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  definition text not null,
  category text,
  aliases jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint glossary_term_unique unique (term),
  constraint glossary_term_length check (char_length(term) between 1 and 200),
  constraint glossary_definition_length check (char_length(definition) between 1 and 2000)
);

create index if not exists idx_glossary_is_active
  on public.glossary (is_active)
  where is_active = true;

alter table public.glossary enable row level security;

drop policy if exists "glossary_anon_read_active" on public.glossary;
create policy "glossary_anon_read_active"
on public.glossary for select to anon
using (is_active = true);

drop policy if exists "glossary_admin_select" on public.glossary;
create policy "glossary_admin_select"
on public.glossary for select to authenticated
using (public.is_admin());

drop policy if exists "glossary_admin_insert" on public.glossary;
create policy "glossary_admin_insert"
on public.glossary for insert to authenticated
with check (public.is_admin());

drop policy if exists "glossary_admin_update" on public.glossary;
create policy "glossary_admin_update"
on public.glossary for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "glossary_admin_delete" on public.glossary;
create policy "glossary_admin_delete"
on public.glossary for delete to authenticated
using (public.is_admin());

revoke all on public.glossary from anon, authenticated;
grant select on public.glossary to anon, authenticated;
grant insert, update, delete on public.glossary to authenticated;

-- -----------------------------------------------------------------------------
-- 8. FAQ — schema only; content remains an editorial activation step
-- -----------------------------------------------------------------------------

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null default '',
  order_index integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists faq_items_visible_order_idx
  on public.faq_items (is_visible, order_index asc, created_at asc);

alter table public.faq_items enable row level security;

drop policy if exists "faq_items_anon_select_visible" on public.faq_items;
create policy "faq_items_anon_select_visible"
on public.faq_items for select to anon
using (is_visible = true);

drop policy if exists "faq_items_admin_all" on public.faq_items;
create policy "faq_items_admin_all"
on public.faq_items for all to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.faq_items from anon, authenticated;
grant select on public.faq_items to anon, authenticated;
grant insert, update, delete on public.faq_items to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Disclaimers — schema only; text activation remains editorial/medical review
-- -----------------------------------------------------------------------------

create table if not exists public.disclaimers (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  body text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.disclaimers enable row level security;

drop policy if exists "disclaimers_anon_read_active" on public.disclaimers;
create policy "disclaimers_anon_read_active"
on public.disclaimers for select to anon
using (is_active = true);

revoke all on public.disclaimers from anon, authenticated;
grant select on public.disclaimers to anon, authenticated;
grant all on public.disclaimers to service_role;

-- -----------------------------------------------------------------------------
-- 10. Blog title A/B tests — public read + RPC-only counter writes
-- -----------------------------------------------------------------------------

create table if not exists public.ab_tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title_a text not null,
  title_b text not null,
  views_a integer not null default 0,
  views_b integer not null default 0,
  clicks_a integer not null default 0,
  clicks_b integer not null default 0,
  winner text check (winner is null or winner in ('a', 'b', 'none')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create unique index if not exists ab_tests_one_active_per_slug
  on public.ab_tests (slug)
  where ended_at is null;

alter table public.ab_tests enable row level security;

drop policy if exists "ab_tests_anon_read_active" on public.ab_tests;
create policy "ab_tests_anon_read_active"
on public.ab_tests for select to anon
using (ended_at is null);

drop policy if exists "ab_tests_admin_all" on public.ab_tests;
create policy "ab_tests_admin_all"
on public.ab_tests for all to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.ab_tests from anon, authenticated;
grant select on public.ab_tests to anon, authenticated;
grant insert, update, delete on public.ab_tests to authenticated;

create or replace function public.increment_ab_views(test_id uuid, variant text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if variant not in ('a', 'b') then
    return;
  end if;
  if variant = 'a' then
    update public.ab_tests
      set views_a = views_a + 1
      where id = test_id and ended_at is null;
  else
    update public.ab_tests
      set views_b = views_b + 1
      where id = test_id and ended_at is null;
  end if;
end;
$$;

create or replace function public.increment_ab_clicks(test_id uuid, variant text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if variant not in ('a', 'b') then
    return;
  end if;
  if variant = 'a' then
    update public.ab_tests
      set clicks_a = clicks_a + 1
      where id = test_id and ended_at is null;
  else
    update public.ab_tests
      set clicks_b = clicks_b + 1
      where id = test_id and ended_at is null;
  end if;
end;
$$;

revoke all on function public.increment_ab_views(uuid, text) from public;
revoke all on function public.increment_ab_clicks(uuid, text) from public;
grant execute on function public.increment_ab_views(uuid, text) to anon, authenticated;
grant execute on function public.increment_ab_clicks(uuid, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 11. Full-text search — no vector dependency
-- -----------------------------------------------------------------------------

alter table public.posts
  add column if not exists search_vector tsvector;

create or replace function public.posts_search_vector_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple'::regconfig, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('simple'::regconfig, coalesce(new.body_markdown, '')), 'C');
  return new;
end;
$$;

drop trigger if exists posts_search_vector_trigger on public.posts;
create trigger posts_search_vector_trigger
before insert or update of title, description, body_markdown
on public.posts
for each row
execute function public.posts_search_vector_update();

update public.posts
set search_vector =
  setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple'::regconfig, coalesce(body_markdown, '')), 'C')
where search_vector is null;

create index if not exists idx_posts_search_vector
  on public.posts using gin (search_vector);

-- -----------------------------------------------------------------------------
-- Deliberately excluded from Gate 0
-- -----------------------------------------------------------------------------
-- create extension vector
-- posts.embedding
-- match_posts
-- embed-post Edge Function
-- pg_cron / pg_net
-- interaction_events (Phase 2 after Gate 0)
