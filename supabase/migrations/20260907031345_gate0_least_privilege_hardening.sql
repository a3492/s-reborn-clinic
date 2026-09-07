-- Gate 0 least-privilege hardening after production reconciliation.

-- 1) Least-privilege grants for admin/internal tables.
revoke all on table public.admin_profiles from anon;
revoke all on table public.audit_logs from anon;
revoke all on table public.media_assets from anon;
revoke all on table public.post_revisions from anon;
revoke all on table public.publish_jobs from anon;

revoke all on table public.consult_requests from anon;
grant insert on table public.consult_requests to anon;

-- 2) Make intentional deny on private comment contacts explicit.
drop policy if exists comment_contacts_no_client_access on public.comment_contacts;
create policy comment_contacts_no_client_access
on public.comment_contacts
for all
to anon, authenticated
using (false)
with check (false);

-- 3) Optimize admin profile self/admin SELECT policy.
drop policy if exists admin_profiles_select_self on public.admin_profiles;
create policy admin_profiles_select_self
on public.admin_profiles
for select
to authenticated
using ((id = (select auth.uid())) or public.is_admin());

-- 4) Consolidate comments permissive policies.
drop policy if exists comments_public_approved on public.comments;
drop policy if exists comments_select_own on public.comments;
drop policy if exists comments_admin_all on public.comments;
drop policy if exists comments_anon_approved on public.comments;
drop policy if exists comments_authenticated_select on public.comments;
drop policy if exists comments_admin_insert on public.comments;
drop policy if exists comments_admin_update on public.comments;
drop policy if exists comments_admin_delete on public.comments;

create policy comments_anon_approved
on public.comments
for select
to anon
using (is_approved = true);

create policy comments_authenticated_select
on public.comments
for select
to authenticated
using (
  is_approved = true
  or user_id = (select auth.uid())
  or public.is_admin()
);

create policy comments_admin_insert
on public.comments
for insert
to authenticated
with check (public.is_admin());

create policy comments_admin_update
on public.comments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy comments_admin_delete
on public.comments
for delete
to authenticated
using (public.is_admin());

-- 5) Consolidate post_reactions authenticated policies.
drop policy if exists post_reactions_admin_all on public.post_reactions;
drop policy if exists post_reactions_reader_insert on public.post_reactions;
drop policy if exists post_reactions_reader_delete on public.post_reactions;
drop policy if exists post_reactions_authenticated_insert on public.post_reactions;
drop policy if exists post_reactions_authenticated_delete on public.post_reactions;

create policy post_reactions_authenticated_insert
on public.post_reactions
for insert
to authenticated
with check (
  (user_id = (select auth.uid()) and session_id is null)
  or public.is_admin()
);

create policy post_reactions_authenticated_delete
on public.post_reactions
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin()
);

-- 6) Cover foreign keys flagged by advisor.
create index if not exists idx_media_assets_uploaded_by on public.media_assets (uploaded_by);
create index if not exists idx_post_reactions_user_id on public.post_reactions (user_id) where user_id is not null;
create index if not exists idx_post_revisions_created_by on public.post_revisions (created_by) where created_by is not null;
create index if not exists idx_posts_created_by on public.posts (created_by) where created_by is not null;
create index if not exists idx_posts_updated_by on public.posts (updated_by) where updated_by is not null;
create index if not exists idx_publish_jobs_requested_by on public.publish_jobs (requested_by) where requested_by is not null;
create index if not exists idx_site_settings_updated_by on public.site_settings (updated_by) where updated_by is not null;

-- 7) Remove one exact duplicate index.
drop index if exists public.idx_consult_requests_created;
