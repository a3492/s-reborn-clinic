-- 홈 "에린이 코너 FAQ" — 공개 조회(anon, 공개 항목만) + 관리자 전체 CRUD

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

-- 공개 홈 빌드: anon 이 공개 항목만 읽기
drop policy if exists "faq_items_anon_select_visible" on public.faq_items;
create policy "faq_items_anon_select_visible"
on public.faq_items
for select
to anon
using (is_visible = true);

-- 관리자 패널: 로그인 JWT 로 전체 CRUD
drop policy if exists "faq_items_admin_all" on public.faq_items;
create policy "faq_items_admin_all"
on public.faq_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
