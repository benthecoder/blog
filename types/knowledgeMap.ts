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
  count: number;
  numClusters: number;
  clusterLabels?: Record<number, string>;
  generatedAt: string;
}

export interface ClusterLabelingOptions {
  maxSamplesPerCluster?: number;
  model?: string;
}
