-- 블로그 posts 전문 검색용 (Supabase SQL 에디터 또는 마이그레이션 파이프라인에서 실행)
-- 앱에서는 search_vector + textSearch(..., config: 'simple') 조합을 사용합니다.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(body_markdown,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN (search_vector);
