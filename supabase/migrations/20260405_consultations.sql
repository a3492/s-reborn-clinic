-- ─────────────────────────────────────────────────────────────────
--  에스리본 클리닉 — 상담 마법사 consultations 테이블
--  Migration: 20260405_consultations.sql
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- 기본 정보
  name text not null,
  phone text not null,
  age_range text,
  gender text,
  language text default 'ko',
  preferred_contact text,

  -- 고민 선택 (예: [{"id": "pore-size", "label": "피부결·모공 > 모공 크기"}, ...])
  concerns jsonb not null default '[]',

  -- 세부 답변 (예: {"skin-texture-duration": ["6개월~1년"], ...})
  answers jsonb not null default '{}',

  -- AI 분석 결과
  ai_summary text,
  ai_recommendations jsonb,

  -- 관리 상태
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'contacted', 'completed')),
  admin_note text,
  assigned_to text,

  updated_at timestamptz default now()
);

-- ── RLS ────────────────────────────────────────────────────────────
alter table public.consultations enable row level security;

-- Service role는 모든 작업 허용 (API routes용)
create policy "service role full access" on public.consultations
  using (true)
  with check (true);

-- ── 인덱스 ─────────────────────────────────────────────────────────
create index if not exists consultations_created_at_idx
  on public.consultations(created_at desc);

create index if not exists consultations_status_idx
  on public.consultations(status);

-- ── updated_at 자동 갱신 트리거 ────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 혹시 이미 있는 트리거는 제거 후 재생성
drop trigger if exists consultations_updated_at on public.consultations;

create trigger consultations_updated_at
  before update on public.consultations
  for each row execute function public.handle_updated_at();
