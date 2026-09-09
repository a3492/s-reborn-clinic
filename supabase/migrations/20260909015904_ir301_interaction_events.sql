-- IR-301 append-only interaction event stream.
--
-- This migration is intentionally limited to the database contract. Existing
-- aggregate/current-state tables remain authoritative during the rollout.
-- Browser roles can append bounded events, but cannot read or mutate them.

create schema if not exists private;

create table public.interaction_events (
  event_id uuid primary key,
  event_name text not null,
  event_version smallint not null default 1,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  content_id uuid references public.posts (id) on delete set null,
  slug text,
  public_path text,
  page_type text not null,
  session_id text not null,
  locale text not null default 'ko',
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb,

  constraint interaction_events_known_name_check check (
    event_name in (
      'article.viewed',
      'article.engaged',
      'article.completed',
      'article.reacted',
      'article.bookmarked',
      'search.executed',
      'search.no_result',
      'search.result_clicked',
      'related.clicked',
      'primary_next.clicked',
      'question.submitted',
      'comment.submitted',
      'error.reported'
    )
  ),
  constraint interaction_events_version_check check (event_version = 1),
  constraint interaction_events_slug_length_check check (
    slug is null or char_length(slug) between 1 and 400
  ),
  constraint interaction_events_public_path_length_check check (
    public_path is null or char_length(public_path) between 1 and 1000
  ),
  constraint interaction_events_page_type_length_check check (
    char_length(page_type) between 1 and 80
  ),
  constraint interaction_events_session_length_check check (
    char_length(session_id) between 1 and 128
  ),
  constraint interaction_events_locale_length_check check (
    char_length(locale) between 2 and 35
  ),
  constraint interaction_events_source_length_check check (
    char_length(source) between 1 and 80
  ),
  constraint interaction_events_metadata_object_check check (
    jsonb_typeof(metadata) = 'object'
  ),
  constraint interaction_events_metadata_size_check check (
    octet_length(metadata::text) <= 8192
  ),
  constraint interaction_events_metadata_sensitive_key_check check (
    not (
      metadata ?| array[
        'email',
        'comment',
        'comment_body',
        'question',
        'question_body',
        'diagnosis',
        'treatment',
        'clinical_detail',
        'ip',
        'ip_address',
        'turnstile_token',
        'token'
      ]
    )
  )
);

create index idx_interaction_events_content_received
  on public.interaction_events (content_id, received_at desc)
  where content_id is not null;

create index idx_interaction_events_name_received
  on public.interaction_events (event_name, received_at desc);

comment on table public.interaction_events is
  'Append-only, pseudonymous visitor interaction events for editorial intelligence. Browser roles have INSERT only.';
comment on column public.interaction_events.content_id is
  'Database-owned canonical posts.id resolved from slug. Client-supplied values are never trusted.';
comment on column public.interaction_events.slug is
  'Interaction-time URL/editorial snapshot. Canonical grouping uses content_id when available.';
comment on column public.interaction_events.metadata is
  'Bounded non-narrative JSON object. Never store raw contact, clinical, question, comment, IP, or anti-bot token data.';

create or replace function private.canonicalize_interaction_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- received_at and content_id are database-owned. This prevents a browser
  -- from forging receive time or attaching an event to an unrelated post.
  new.received_at := now();
  new.content_id := null;

  if new.slug is not null then
    select p.id
    into new.content_id
    from public.posts p
    where p.slug = new.slug
    limit 1;
  end if;

  return new;
end;
$$;

revoke all on function private.canonicalize_interaction_event()
  from public, anon, authenticated;

create trigger trg_interaction_events_canonicalize
before insert on public.interaction_events
for each row execute function private.canonicalize_interaction_event();

alter table public.interaction_events enable row level security;

create policy interaction_events_browser_insert
on public.interaction_events
for insert
to anon, authenticated
with check (source = 'web');

-- Existing projects may still auto-grant broad privileges on new public
-- tables. Reset first, then expose the one browser operation this stream needs.
revoke all on table public.interaction_events from public, anon, authenticated;
grant insert on table public.interaction_events to anon, authenticated;
grant select, insert, update, delete on table public.interaction_events to service_role;
