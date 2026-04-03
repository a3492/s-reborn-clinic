create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  slug text not null unique,
  category text,
  subcategory text,
  tags text[] not null default '{}',
  thumbnail_url text,
  body_markdown text not null default '',
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  published_at timestamptz,
  scheduled_at timestamptz,
  seo_title text,
  seo_description text,
  canonical_url text,
  created_by uuid references public.admin_profiles (id),
  updated_by uuid references public.admin_profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  body_markdown text not null,
  meta_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references public.admin_profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.admin_profiles (id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_status on public.posts (status);
create index if not exists idx_posts_updated_at on public.posts (updated_at desc);
create index if not exists idx_posts_slug on public.posts (slug);
create index if not exists idx_post_revisions_post_id on public.post_revisions (post_id, created_at desc);
create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_posts_set_updated_at on public.posts;
create trigger trg_posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_revisions enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.role in ('owner', 'editor')
  );
$$;

drop policy if exists "admin_profiles_select_self" on public.admin_profiles;
create policy "admin_profiles_select_self"
on public.admin_profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "posts_admin_all" on public.posts;
create policy "posts_admin_all"
on public.posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "post_revisions_admin_all" on public.post_revisions;
create policy "post_revisions_admin_all"
on public.post_revisions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "audit_logs_owner_insert" on public.audit_logs;
create policy "audit_logs_owner_insert"
on public.audit_logs
for insert
to authenticated
with check (public.is_admin());
