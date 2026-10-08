-- Both rows must have valid=true and ready=true. Check the definitions against
-- search-indexes.sql; IF NOT EXISTS alone does not verify an existing index.
WITH expected(name) AS (
  VALUES ('idx_content_chunks_search_text'), ('idx_content_chunks_search_title')
)
SELECT expected.name,
  i.indisvalid AS valid,
  i.indisready AS ready,
  pg_get_indexdef(i.indexrelid) AS definition,
  pg_relation_size(i.indexrelid) AS bytes
FROM expected
LEFT JOIN pg_class c
  ON c.relname = expected.name AND c.relnamespace = 'public'::regnamespace
LEFT JOIN pg_index i
  ON i.indexrelid = c.oid AND i.indrelid = 'public.content_chunks'::regclass
ORDER BY expected.name;
