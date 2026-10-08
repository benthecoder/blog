-- Run each statement separately, outside a transaction.
-- These indexes are optional; the existing search queries still work without them.
DROP INDEX CONCURRENTLY IF EXISTS public.idx_content_chunks_search_title;

DROP INDEX CONCURRENTLY IF EXISTS public.idx_content_chunks_search_text;
