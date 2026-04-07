-- 글 수정·발행 스냅샷 (최대 30개/slug 유지) — 적용 후 RLS 확인

CREATE TABLE IF NOT EXISTS public.post_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts (id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text,
  body_markdown text,
  changed_by text,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_versions_slug_created_idx ON public.post_versions (slug, created_at DESC);
CREATE INDEX IF NOT EXISTS post_versions_post_id_idx ON public.post_versions (post_id);

ALTER TABLE public.post_versions ENABLE ROW LEVEL SECURITY;

-- admin_phase1 의 public.is_admin() 재사용
CREATE POLICY "post_versions_admin_select"
  ON public.post_versions FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "post_versions_admin_insert"
  ON public.post_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.cleanup_old_versions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.post_versions pv
  WHERE pv.slug = NEW.slug
    AND pv.id NOT IN (
      SELECT id FROM public.post_versions
      WHERE slug = NEW.slug
      ORDER BY created_at DESC
      LIMIT 30
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_versions_trigger ON public.post_versions;
CREATE TRIGGER cleanup_versions_trigger
  AFTER INSERT ON public.post_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_versions();
