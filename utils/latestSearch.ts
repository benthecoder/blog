import type { SearchResultItem, SearchType } from "@/types/search";
import type { ChunkType } from "@/types/chunks";
import { parseSearchCache } from "./searchCache";

export interface SearchInput {
  query: string;
  searchType: SearchType;
  chunkType?: ChunkType | "";
}

type Outcome = { results: SearchResultItem[]; error: string };

/** Cancellation also invalidates responses from fetch implementations that ignore abort. */
export class LatestSearch {
  private controller: AbortController | null = null;
  private generation = 0;

  cancel() {
    this.generation++;
    this.controller?.abort();
    this.controller = null;
  }

  async run(input: SearchInput): Promise<Outcome | null> {
    this.cancel();
    const generation = this.generation;
    const controller = new AbortController();
    this.controller = controller;
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...input,
          query: input.query.trim(),
          chunkType: input.chunkType || undefined,
        }),
      });
      if (!response.ok) throw new Error("Search unavailable");
      const data = await response.json();
      const results = parseSearchCache(JSON.stringify(data.results));
      if (!results) throw new Error("Invalid search response");
      return generation === this.generation ? { results, error: "" } : null;
    } catch {
      return generation === this.generation
        ? { results: [], error: "Search unavailable. Try again." }
        : null;
    } finally {
      if (generation === this.generation) this.controller = null;
    }
  }
}
