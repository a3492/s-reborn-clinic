-- 유사 글 검색 (anon RPC — published 행만 RLS로 노출)
-- enable_pgvector.sql 적용 후 실행

CREATE OR REPLACE FUNCTION public.match_posts(
  query_embedding vector(1536),
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 3,
  exclude_slug text DEFAULT ''
)
RETURNS TABLE (
  slug text,
  title text,
  description text,
  category text,
  published_at timestamptz,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.slug,
    p.title,
    p.description,
    p.category,
    p.published_at,
    (1 - (p.embedding <=> query_embedding))::double precision AS similarity
  FROM public.posts p
  WHERE p.status = 'published'
    AND p.slug IS DISTINCT FROM exclude_slug
    AND p.embedding IS NOT NULL
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_posts(vector(1536), double precision, integer, text) TO anon, authenticated;
