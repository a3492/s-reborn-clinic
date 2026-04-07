-- 글 작성용 템플릿 (Supabase에만 저장, 정적 파일로보내지 않음)

CREATE TABLE IF NOT EXISTS public.post_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  body_markdown text NOT NULL,
  default_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_templates_created_at ON public.post_templates (created_at DESC);

ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

-- 어드민만 CRUD (anon 접근 없음)
CREATE POLICY "post_templates_admin_all"
  ON public.post_templates FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
