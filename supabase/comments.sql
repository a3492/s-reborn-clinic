-- 블로그 댓글 (Realtime). public.is_admin() 은 admin_phase1 마이그레이션 선행.
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  body text NOT NULL CHECK (char_length(body) <= 500),
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT comments_author_name_len CHECK (char_length(author_name) <= 50)
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read approved" ON public.comments;
CREATE POLICY "anon read approved"
  ON public.comments FOR SELECT TO anon USING (is_approved = true);

DROP POLICY IF EXISTS "anon insert" ON public.comments;
CREATE POLICY "anon insert"
  ON public.comments FOR INSERT TO anon
  WITH CHECK (
    char_length(body) <= 500
    AND char_length(author_name) <= 50
    AND user_id IS NULL
  );

DROP POLICY IF EXISTS "comments_select_own" ON public.comments;
CREATE POLICY "comments_select_own"
  ON public.comments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "comments_authenticated_insert" ON public.comments;
CREATE POLICY "comments_authenticated_insert"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND char_length(body) <= 500
    AND char_length(author_name) <= 50
  );

DROP POLICY IF EXISTS "comments_admin_select" ON public.comments;
CREATE POLICY "comments_admin_select" ON public.comments
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "comments_admin_update" ON public.comments;
CREATE POLICY "comments_admin_update" ON public.comments
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "comments_admin_delete" ON public.comments;
CREATE POLICY "comments_admin_delete" ON public.comments
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_comments_slug_created ON public.comments (slug, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_created ON public.comments (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Realtime (멱등)
DO $rt$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END $rt$;

COMMENT ON TABLE public.comments IS '블로그 글 댓글 (승인 후 공개, 1단계 대댓글)';
