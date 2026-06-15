export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export function parseEmbedding(embedding: unknown): number[] {
  if (Array.isArray(embedding)) return embedding;
  if (typeof embedding === "string") {
    try {
      const parsed = JSON.parse(embedding);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Parse PostgreSQL vector format [x,y,z]
      const cleaned = embedding.replace(/[\[\]]/g, "");
      return cleaned.split(",").map(Number);
    }
  }
  return [];
}
