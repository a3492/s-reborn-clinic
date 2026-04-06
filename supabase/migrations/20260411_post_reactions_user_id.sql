-- 독자 소셜 로그인: 반응 행은 user_id(로그인) 또는 session_id(비로그인) 중 하나만
-- 적용 전: post_reactions 는 PK(slug, reaction, session_id)

ALTER TABLE public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_pkey;

ALTER TABLE public.post_reactions ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
UPDATE public.post_reactions SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE public.post_reactions ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.post_reactions ADD PRIMARY KEY (id);

ALTER TABLE public.post_reactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;
ALTER TABLE public.post_reactions ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_one_identity;
ALTER TABLE public.post_reactions ADD CONSTRAINT post_reactions_one_identity CHECK (
  (user_id IS NOT NULL AND session_id IS NULL)
  OR (user_id IS NULL AND session_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_unique_anon
  ON public.post_reactions (slug, reaction, session_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_unique_user
  ON public.post_reactions (slug, reaction, user_id)
  WHERE user_id IS NOT NULL;

DROP POLICY IF EXISTS "anon all" ON public.post_reactions;
DROP POLICY IF EXISTS "authenticated admin post_reactions" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_select_public" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_anon_write" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_anon_delete" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_reader_insert" ON public.post_reactions;
DROP POLICY IF EXISTS "post_reactions_reader_delete" ON public.post_reactions;

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
