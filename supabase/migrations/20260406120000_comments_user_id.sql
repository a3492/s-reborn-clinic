-- 독자 마이페이지: 로그인 사용자 댓글 연결 + 계정 삭제 시 CASCADE
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_user_created ON public.comments (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

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
