-- 공개 블로그 독자 반응 (slug = 정적 블로그 글 id)
-- 비로그인: session_id만 / 로그인: user_id만 (둘 중 하나, CHECK 제약)
-- is_admin() 은 migrations/20260403_admin_phase1.sql 이 먼저 적용되어 있어야 합니다.
-- 기존 DB는 migrations/20260411_post_reactions_user_id.sql 로 마이그레이션하세요.

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  reaction text NOT NULL,
  session_id text,
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT post_reactions_one_identity CHECK (
    (user_id IS NOT NULL AND session_id IS NULL)
    OR (user_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_unique_anon
  ON public.post_reactions (slug, reaction, session_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_unique_user
  ON public.post_reactions (slug, reaction, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_reactions_slug ON public.post_reactions (slug);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reactions_select_public" ON public.post_reactions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "post_reactions_anon_insert" ON public.post_reactions
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "post_reactions_anon_delete" ON public.post_reactions
  FOR DELETE TO anon
  USING (user_id IS NULL);

CREATE POLICY "post_reactions_reader_insert" ON public.post_reactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND session_id IS NULL);

CREATE POLICY "post_reactions_reader_delete" ON public.post_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "authenticated admin post_reactions" ON public.post_reactions
  FOR ALL TO authenticated
  USING (public.is_admin ())
  WITH CHECK (public.is_admin ());
