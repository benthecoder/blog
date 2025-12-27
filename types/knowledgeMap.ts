/**
 * Article data structure for knowledge map visualization
 */
export interface ArticleData {
  id: string;
  postSlug: string;
  postTitle: string;
  content: string;
  chunkType: string;
  metadata: {
    published_date?: string;
    tags?: string[];
    [key: string]: any;
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

/**
 * Knowledge map JSON output structure
 */
export interface KnowledgeMapOutput {
  success: boolean;
  data: ArticleData[];
  count: number;
  numClusters: number;
  clusterLabels?: Record<number, string>;
  generatedAt: string;
}

/**
 * Cluster labeling options
 */
export interface ClusterLabelingOptions {
  maxSamplesPerCluster?: number;
  minSamplesPerCluster?: number;
  model?: string;
}
