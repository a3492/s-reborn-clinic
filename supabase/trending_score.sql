-- 인기·트렌드 순위 (조회·반응·댓글·최신 보정). posts / post_views / post_reactions / comments 선행.
-- anon RPC: 클라이언트에서 실시간 호출.

CREATE OR REPLACE FUNCTION public.get_trending_posts(
  days_back int DEFAULT 7,
  result_limit int DEFAULT 20
)
RETURNS TABLE (
  slug text,
  title text,
  description text,
  category text,
  published_at timestamptz,
  thumbnail_url text,
  trend_score numeric
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
    p.thumbnail_url,
    COALESCE(v.view_count, 0)::numeric
      + COALESCE(r.reaction_count, 0)::numeric * 3
      + COALESCE(c.comment_count, 0)::numeric * 5
      + CASE
          WHEN p.published_at > now() - interval '7 days' THEN 20::numeric
          WHEN p.published_at > now() - interval '30 days' THEN 10::numeric
          ELSE 0::numeric
        END AS trend_score
  FROM public.posts p
  LEFT JOIN public.post_views v ON v.slug = p.slug
  LEFT JOIN (
    SELECT pr.slug, COUNT(*)::bigint AS reaction_count
    FROM public.post_reactions pr
    WHERE pr.created_at > now() - (days_back || ' days')::interval
    GROUP BY pr.slug
  ) r ON r.slug = p.slug
  LEFT JOIN (
    SELECT cm.slug, COUNT(*)::bigint AS comment_count
    FROM public.comments cm
    WHERE cm.is_approved = true
      AND cm.created_at > now() - (days_back || ' days')::interval
    GROUP BY cm.slug
  ) c ON c.slug = p.slug
  WHERE p.status = 'published'
  ORDER BY trend_score DESC NULLS LAST, p.published_at DESC NULLS LAST
  LIMIT result_limit;
END;
$$;

-- 전체 기간 조회수 순 (탭「전체」)
CREATE OR REPLACE FUNCTION public.get_top_posts_by_views(
  result_limit int DEFAULT 20
)
RETURNS TABLE (
  slug text,
  title text,
  description text,
  category text,
  published_at timestamptz,
  thumbnail_url text,
  trend_score numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.slug,
    p.title,
    p.description,
    p.category,
    p.published_at,
    p.thumbnail_url,
    COALESCE(v.view_count, 0)::numeric AS trend_score
  FROM public.posts p
  LEFT JOIN public.post_views v ON v.slug = p.slug
  WHERE p.status = 'published'
  ORDER BY COALESCE(v.view_count, 0) DESC, p.published_at DESC NULLS LAST
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_posts(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_posts_by_views(int) TO anon, authenticated;
