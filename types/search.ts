import type { ChunkType } from "./chunks";

export type SearchType = "hybrid" | "semantic" | "keyword";

export interface SearchResultItem {
  content: string;
  post_slug: string;
  post_title: string;
  chunk_type: ChunkType;
  tags: string[];
  published_date?: string;
  similarity: number;
  vector_similarity?: number;
  keyword_score?: number;
  score_type: SearchType;
  section?: string;
  language?: string;
}
