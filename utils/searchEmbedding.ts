import "server-only";
import { unstable_cache } from "next/cache";
import { VOYAGE_MODEL } from "@/config/constants";
import { getVoyageClient } from "./clients";

const pendingEmbeddings = new Map<string, Promise<number[]>>();

const cachedEmbedding = unstable_cache(
  (query: string, model: string): Promise<number[]> => {
    const key = JSON.stringify([query, model]);
    const pending = pendingEmbeddings.get(key);
    if (pending) return pending;
    const request = (async () => {
      const response = await getVoyageClient().embed(
        { model, input: query, inputType: "document" },
        { timeoutInSeconds: 10, maxRetries: 0 }
      );
      const embedding = response.data?.[0]?.embedding;
      if (
        !Array.isArray(embedding) ||
        embedding.length !== 1024 ||
        !embedding.every((value) => Number.isFinite(value))
      ) {
        throw new Error("Invalid search embedding");
      }
      return embedding;
    })().finally(() => pendingEmbeddings.delete(key));
    pendingEmbeddings.set(key, request);
    return request;
  },
  ["search-embedding-document-1024-v1"],
  { revalidate: 3600 }
);

export function getSearchEmbedding(query: string): Promise<number[]> {
  return cachedEmbedding(query, VOYAGE_MODEL);
}
