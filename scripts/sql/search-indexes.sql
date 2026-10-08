-- Run each statement separately, outside a transaction.
-- These expressions match app/api/search/route.ts exactly.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_chunks_search_text
  ON public.content_chunks USING GIN
  (to_tsvector('english', content || ' ' || post_title));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_chunks_search_title
  ON public.content_chunks USING GIN
  (to_tsvector('english', post_title));
