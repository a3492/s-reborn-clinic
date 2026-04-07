-- pgvector + posts.embedding (1536 = text-embedding-3-small)
-- Supabase 대시보드 SQL 또는 마이그레이션으로 적용 후 인덱스 튜닝(데이터 누적 후 ANALYZE 권장)

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS posts_embedding_idx
  ON public.posts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
