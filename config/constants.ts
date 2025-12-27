// Embedding config
export const EMBEDDING_DIMENSIONS = 1024;
export const VOYAGE_MODEL = "voyage-3.5-lite";
export const VOYAGE_INPUT_TYPE = "document";

// Semantic search thresholds
export const SEMANTIC_SIMILARITY_THRESHOLD_STRICT = 0.5;
export const SEMANTIC_SIMILARITY_THRESHOLD = 0.4;

// Hybrid search weights
export const HYBRID_VECTOR_WEIGHT = 0.7;
export const HYBRID_KEYWORD_WEIGHT = 0.3;
export const TITLE_MATCH_MULTIPLIER = 2.0;

// Search result limits
export const SEARCH_RESULT_LIMIT = 25;
export const SEARCH_FALLBACK_LIMIT = 15;

// Markdown chunking - Simplified strategy-based approach
export const MIN_CHUNK_LENGTH = 100; // Minimum chars for a meaningful chunk
export const MIN_WORD_COUNT = 12; // Minimum words for semantic meaning
export const MIN_QUOTE_LENGTH = 50; // Quotes can be shorter (profound thoughts)
export const MIN_SECTION_LENGTH = 150; // Sections should have substantial content
export const MIN_BULLET_POINTS = 3; // Lists need multiple items to be useful

// Whole post embedding (VoyageAI supports up to ~64k chars)
export const MAX_WHOLE_POST_LENGTH = 50000;

// Rate limiting & batching
export const DELAY_BETWEEN_BATCHES = 200; // Delay between large cross-post batches
export const MAX_RETRIES = 5;
export const INITIAL_RETRY_DELAY = 2000;
export const API_TIMEOUT = 60000;

// Cluster labeling config
export const NUM_CLUSTERS = 15; // Number of k-means clusters
export const ANTHROPIC_CLUSTER_MODEL = "claude-haiku-4-5"; // Latest Haiku model
export const CLUSTER_LABEL_MAX_SAMPLES = 8; // Increased for better diversity
export const CLUSTER_LABEL_MIN_SAMPLES = 3;
export const CLUSTER_LABEL_TIMEOUT = 30000; // 30s
