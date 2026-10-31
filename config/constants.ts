export const DRAWINGS_URL = "/images/drawings";

export const VOYAGE_MODEL = "voyage-3.5-lite";

export const SEMANTIC_SIMILARITY_THRESHOLD = 0.4;

export const SEARCH_RESULT_LIMIT = 25;
export const SEARCH_FALLBACK_LIMIT = 15;
export const SEARCH_CANDIDATE_LIMIT = 60; // per candidate list (vector / keyword) before fusion
export const SEARCH_RRF_K = 60; // reciprocal rank fusion damping: 1 / (k + rank)
export const SEARCH_MAX_PER_POST = 2; // chunks per post in the final list
export const SEARCH_RATE_LIMIT = 60; // requests per IP per window
export const SEARCH_RATE_WINDOW_SECONDS = 60;

export const MIN_QUOTE_LENGTH = 50; // quotes can be shorter — "be water" is 2 words
export const MIN_SECTION_LENGTH = 150;

// VoyageAI supports up to ~64k chars per input
export const MAX_WHOLE_POST_LENGTH = 50000;

export const DELAY_BETWEEN_BATCHES = 200;
export const MAX_RETRIES = 5;
export const INITIAL_RETRY_DELAY = 2000;
export const API_TIMEOUT = 60000;

// Clustering: Ward linkage on a 10D UMAP of idea-summary vectors, with the
// cluster count picked by silhouette; the 2D layout is supervised by the
// clusters so each one occupies a contiguous region
export const CLUSTERING_UMAP_COMPONENTS = 10;
export const CLUSTERING_UMAP_NEIGHBORS = 10;
export const CLUSTER_MIN_COUNT = 16;
export const CLUSTER_MAX_COUNT = 30;
export const CLUSTER_MAX_FRACTION = 0.08; // split clusters larger than this share of posts
export const CLUSTER_MERGE_THRESHOLD = 0.85; // merge clusters closer than this (see mergeCloseClusters)
export const CLUSTER_NOISE_SILHOUETTE = 0; // posts scoring below this stay unclustered
export const CLUSTER_MIN_SIZE = 6; // smaller clusters dissolve into noise
export const SIMILARITY_EDGE_THRESHOLD = 0.7; // min cosine sim for a map edge
export const CLUSTER_LABEL_TOP_TERMS = 12;
// Offline map pipeline models (Google AI via the AI SDK; free tier)
// free-tier limits are per model, so these are tried in order as each runs dry
export const LLM_MODELS = [
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
];
// Idea summaries: batched to stay inside the free tier's limits
export const SUMMARY_BATCH_SIZE = 20;
export const SUMMARY_MAX_REQUESTS = 60;
export const SUMMARY_MAX_CHARS = 900;
// Reuse a previous cluster's label when post overlap (Jaccard) is at least this
export const CLUSTER_LABEL_REUSE_MIN_OVERLAP = 0.6;
