-- 블로그 본문 용어 툴팁 (anon은 활성 항목만 조회, 관리자는 전체 CRUD)
CREATE TABLE IF NOT EXISTS public.glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL,
  category text,
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT glossary_term_unique UNIQUE (term)
);

CREATE INDEX IF NOT EXISTS idx_glossary_is_active ON public.glossary (is_active) WHERE is_active = true;

ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "glossary_anon_read_active" ON public.glossary;
CREATE POLICY "glossary_anon_read_active"
  ON public.glossary FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "glossary_admin_select" ON public.glossary;
CREATE POLICY "glossary_admin_select"
  ON public.glossary FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "glossary_admin_insert" ON public.glossary;
CREATE POLICY "glossary_admin_insert"
  ON public.glossary FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "glossary_admin_update" ON public.glossary;
CREATE POLICY "glossary_admin_update"
  ON public.glossary FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "glossary_admin_delete" ON public.glossary;
CREATE POLICY "glossary_admin_delete"
  ON public.glossary FOR DELETE TO authenticated
  USING (public.is_admin());

COMMENT ON TABLE public.glossary IS '블로그/아카데미 글 용어 설명(툴팁). category: ai | medical | legal 등 자유 텍스트';

INSERT INTO public.glossary (term, definition, category, aliases) VALUES
  (
    'LLM',
    '거대 언어 모델(Large Language Model). GPT-4, Claude 등이 해당합니다.',
    'ai',
    '[]'::jsonb
  ),
  (
    'RAG',
    '검색 증강 생성(Retrieval-Augmented Generation). AI가 외부 문서를 검색해 답변하는 방식.',
    'ai',
    '[]'::jsonb
  ),
  (
    '할루시네이션',
    'AI가 사실이 아닌 내용을 자신 있게 생성하는 현상.',
    'ai',
    '["환각"]'::jsonb
  )
ON CONFLICT (term) DO NOTHING;
