create table if not exists public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  job_type text not null default 'publish' check (job_type in ('publish', 'republish')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'success', 'failed')),
  target_repo text,
  target_branch text,
  target_path text,
  commit_sha text,
  error_message text,
  requested_by uuid references public.admin_profiles (id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_publish_jobs_post_id on public.publish_jobs (post_id, created_at desc);
create index if not exists idx_publish_jobs_status on public.publish_jobs (status, created_at desc);

alter table public.publish_jobs enable row level security;

drop policy if exists "publish_jobs_admin_all" on public.publish_jobs;
create policy "publish_jobs_admin_all"
on public.publish_jobs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
