-- 블로그 글별 독자 투표 (slug당 최대 1개)
-- 적용 후 RLS·어드민 정책 확인

CREATE TABLE IF NOT EXISTS public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  question text NOT NULL,
  options jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  poll_id uuid NOT NULL REFERENCES public.polls (id) ON DELETE CASCADE,
  option_id text NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON public.poll_votes (poll_id);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polls_anon_select"
  ON public.polls FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "poll_votes_anon_select"
  ON public.poll_votes FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "poll_votes_anon_insert"
  ON public.poll_votes FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "polls_admin_all"
  ON public.polls FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
