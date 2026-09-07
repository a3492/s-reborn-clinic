-- IR-101 Publishing Correctness foundation
-- Separates Git commit/build intent from verified public-live state.
-- Safe additive migration; no table reset/recreate.

alter table public.posts
  add column if not exists deploy_status text not null default 'idle',
  add column if not exists publish_requested_at timestamptz,
  add column if not exists public_verified_at timestamptz,
  add column if not exists public_url text,
  add column if not exists last_publish_result jsonb not null default '{}'::jsonb;

alter table public.posts drop constraint if exists posts_deploy_status_check;
alter table public.posts add constraint posts_deploy_status_check
  check (deploy_status in (
    'idle',
    'queued',
    'validating',
    'build_pending',
    'deploying',
    'live',
    'failed',
    'rolled_back'
  ));

alter table public.publish_jobs
  add column if not exists content_version bigint not null default 1,
  add column if not exists request_key text,
  add column if not exists public_url text,
  add column if not exists deploy_started_at timestamptz,
  add column if not exists public_verified_at timestamptz,
  add column if not exists live_check jsonb not null default '{}'::jsonb;

-- Preserve compatibility with legacy rows if this migration is replayed on a
-- database that already contains historical jobs.
alter table public.publish_jobs drop constraint if exists publish_jobs_status_check;
update public.publish_jobs set status = 'validating' where status = 'processing';
update public.publish_jobs set status = 'live' where status = 'success';
alter table public.publish_jobs add constraint publish_jobs_status_check
  check (status in (
    'pending',
    'validating',
    'build_pending',
    'deploying',
    'live',
    'failed',
    'rolled_back'
  ));

-- Same content version may have at most one active publish job.
-- Failed/rolled-back versions may be retried explicitly.
create unique index if not exists idx_publish_jobs_one_active_version
  on public.publish_jobs(post_id, content_version)
  where status in ('pending', 'validating', 'build_pending', 'deploying');

create index if not exists idx_publish_jobs_commit_sha
  on public.publish_jobs(commit_sha)
  where commit_sha is not null;

create index if not exists idx_posts_deploy_status
  on public.posts(deploy_status);

comment on column public.posts.deploy_status is
  'Operational publish state. live means public deployment has been independently verified.';
comment on column public.posts.public_verified_at is
  'Timestamp of successful public smoke verification for the current live version.';
comment on column public.publish_jobs.content_version is
  'Canonical posts.content_version reserved by this publish attempt; used for idempotency.';
