-- Owner-only admin_profiles mutations; editors cannot soft-delete media via deleted_at.

create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.role = 'owner'
  );
$$;

drop policy if exists "admin_profiles_owner_update" on public.admin_profiles;
create policy "admin_profiles_owner_update"
on public.admin_profiles
for update
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists "admin_profiles_owner_delete" on public.admin_profiles;
create policy "admin_profiles_owner_delete"
on public.admin_profiles
for delete
to authenticated
using (public.is_owner());

create or replace function public.media_assets_prevent_editor_soft_delete()
returns trigger
language plpgsql
as $$
begin
  if (old.deleted_at is distinct from new.deleted_at)
     and not public.is_owner() then
    raise exception 'media soft-delete is restricted to owners';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_media_assets_editor_soft_delete_guard on public.media_assets;
create trigger trg_media_assets_editor_soft_delete_guard
before update on public.media_assets
for each row
execute function public.media_assets_prevent_editor_soft_delete();
