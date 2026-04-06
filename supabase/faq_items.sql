-- 수동 적용용 (migrations/20260405_faq_items.sql 과 동일)
-- Supabase SQL Editor 에서 실행하거나 CLI 마이그레이션으로 적용하세요.

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
on public.faq_items
for select
to anon
using (is_visible = true);

drop policy if exists "faq_items_admin_all" on public.faq_items;
create policy "faq_items_admin_all"
on public.faq_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
