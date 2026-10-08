import type { EmbeddingRow } from "./prepareEmbeddings";

export const INSERT_EMBEDDINGS_SQL = `
  INSERT INTO content_chunks (
    id, post_slug, post_title, content, chunk_type, metadata,
    sequence, embedding, published_date, tags
  )
  SELECT id, post_slug, post_title, content, chunk_type, metadata,
    sequence, embedding::vector(1024), published_date, tags
  FROM jsonb_to_recordset($1::jsonb) AS chunks(
    id uuid, post_slug text, post_title text, content text, chunk_type text,
    metadata jsonb, sequence integer, embedding text, published_date date, tags text[]
  )
`;

/** Replace the entire requested scope atomically, using an already connected client. */
export async function replaceEmbeddings(
  client: { query(text: string, values?: unknown[]): Promise<unknown> },
  rows: EmbeddingRow[],
  slug?: string
): Promise<void> {
  if (
    rows.length === 0 ||
    (slug !== undefined &&
      (!slug || rows.some((row) => row.post_slug !== slug)))
  ) {
    throw new Error("Invalid embedding replacement scope");
  }
  await client.query("BEGIN");
  try {
    // Serialize both full rebuilds and single-post updates during their short commit phase.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('blog:content_chunks'))"
    );
    if (slug !== undefined) {
      await client.query("DELETE FROM content_chunks WHERE post_slug = $1", [
        slug,
      ]);
    } else {
      await client.query("DELETE FROM content_chunks");
    }
    for (let start = 0; start < rows.length; start += 120) {
      await client.query(INSERT_EMBEDDINGS_SQL, [
        JSON.stringify(rows.slice(start, start + 120)),
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "Embedding replacement failed and rollback could not be confirmed"
      );
    }
    throw error;
  }
}
