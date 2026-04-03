create table if not exists public.consult_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  interest text,
  concern text not null default '',
  preferred_time text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'contacted', 'done', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consult_requests_status on public.consult_requests (status, created_at desc);
create index if not exists idx_consult_requests_created_at on public.consult_requests (created_at desc);

create or replace function public.set_consult_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_consult_requests_updated_at on public.consult_requests;
create trigger trg_consult_requests_updated_at
before update on public.consult_requests
for each row
execute function public.set_consult_requests_updated_at();

alter table public.consult_requests enable row level security;

-- 누구나 상담 신청을 INSERT할 수 있도록 anon 역할 허용
drop policy if exists "consult_requests_anon_insert" on public.consult_requests;
create policy "consult_requests_anon_insert"
on public.consult_requests
for insert
to anon, authenticated
with check (true);

-- 관리자만 조회/수정/삭제 가능
drop policy if exists "consult_requests_admin_select" on public.consult_requests;
create policy "consult_requests_admin_select"
on public.consult_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "consult_requests_admin_update" on public.consult_requests;
create policy "consult_requests_admin_update"
on public.consult_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "consult_requests_admin_delete" on public.consult_requests;
create policy "consult_requests_admin_delete"
on public.consult_requests
for delete
to authenticated
using (public.is_admin());
