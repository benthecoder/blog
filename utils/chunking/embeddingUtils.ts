export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
