export interface ArticleData {
  id: string;
  postSlug: string;
  postTitle: string;
  content: string;
  chunkType: string;
  metadata: {
    published_date?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  sequence: number;
  embedding: number[];
  // idea summary used for labeling
  summary?: string;
  publishedDate?: string;
  tags: string[];
  createdAt: string;
  index: number;
  x: number;
  y: number;
  cluster: number;
}

export interface ArticleNode {
  id: string;
  postSlug: string;
  postTitle: string;
  wordCount: number;
  publishedDate?: string;
  tags: string[];
  x: number;
  y: number;
  cluster: number;
}

// [indexA, indexB, cosine similarity] — indices into `data`, only pairs
// above SIMILARITY_EDGE_THRESHOLD
export type SimilarityEdge = [number, number, number];

export interface KnowledgeMapOutput {
  success: boolean;
  data: ArticleNode[];
  similarityEdges: SimilarityEdge[];
  // one-line idea summary per post slug
  summaries?: Record<string, string>;
  count: number;
  numClusters: number;
  clusterLabels?: Record<number, string>;
  generatedAt: string;
  // count:max(created_at) of embedding rows — lets builds skip regeneration
  sourceFingerprint?: string;
}

export interface PreviousClusterLabel {
  slugs: string[];
  label: string;
}

export interface ClusterLabelingOptions {
  // labels from the last generated map, reused for clusters that still match
  previous?: PreviousClusterLabel[];
  // distinctive terms per cluster ID
  terms?: Map<number, string[]>;
}

export type KnowledgeMapPreview = Omit<
  KnowledgeMapOutput,
  "similarityEdges" | "summaries"
> & {
  similarityEdgesUrl: string;
  summariesUrl?: string;
};
