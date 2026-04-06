-- Task 18: 이메일 알림 구독 (LAB·블로그 공통 waitlist)
-- 기존 lab_waitlist가 있으면 source 컬럼만 추가, 없으면 테이블 생성

CREATE TABLE IF NOT EXISTS public.lab_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_waitlist ADD COLUMN IF NOT EXISTS source text DEFAULT 'lab';

ALTER TABLE public.lab_waitlist ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS lab_waitlist_email_unique ON public.lab_waitlist (email);

ALTER TABLE public.lab_waitlist ENABLE ROW LEVEL SECURITY;
