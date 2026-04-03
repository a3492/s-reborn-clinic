create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_provider text not null default 'manual',
  storage_bucket text,
  file_path text,
  public_url text not null,
  mime_type text,
  alt_text text,
  caption text,
  width integer,
  height integer,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_assets_public_url_key on public.media_assets (public_url);
create index if not exists media_assets_created_at_idx on public.media_assets (created_at desc);

create or replace function public.set_media_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_media_assets_updated_at on public.media_assets;
create trigger trg_media_assets_updated_at
before update on public.media_assets
for each row
execute function public.set_media_assets_updated_at();

alter table public.media_assets enable row level security;

drop policy if exists media_assets_admin_all on public.media_assets;
create policy media_assets_admin_all
on public.media_assets
for all
using (public.is_admin())
with check (public.is_admin());
