alter table public.media_assets
  add column if not exists deleted_at timestamptz;

create index if not exists media_assets_deleted_at_idx
  on public.media_assets (deleted_at desc);
