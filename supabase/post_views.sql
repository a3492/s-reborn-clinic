-- 공개 블로그 조회수 (slug = content collection id, 예: doctor-column/foo)
-- Supabase SQL Editor 또는 마이그레이션으로 적용
-- authenticated 정책에 public.is_admin() 이 있으므로 admin_phase1 마이그레이션 이후에 실행하세요.

CREATE TABLE IF NOT EXISTS public.post_views (
  slug text PRIMARY KEY,
  view_count bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read" ON public.post_views;
CREATE POLICY "anon read" ON public.post_views FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon upsert" ON public.post_views;
CREATE POLICY "anon upsert" ON public.post_views FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon update" ON public.post_views;
CREATE POLICY "anon update" ON public.post_views FOR UPDATE TO anon USING (true);

-- 어드민 대시보드(authenticated + is_admin)
DROP POLICY IF EXISTS "authenticated all post_views" ON public.post_views;
CREATE POLICY "authenticated all post_views" ON public.post_views FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 경쟁 없이 +1 (클라이언트 upsert 대안)
CREATE OR REPLACE FUNCTION public.increment_post_view(p_slug text)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.post_views (slug, view_count, updated_at)
  VALUES (p_slug, 1, now())
  ON CONFLICT (slug) DO UPDATE SET
    view_count = public.post_views.view_count + 1,
    updated_at = now()
  RETURNING view_count;
$$;

REVOKE ALL ON FUNCTION public.increment_post_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_post_view(text) TO anon, authenticated;
