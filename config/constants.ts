export const DRAWINGS_URL = "/images/drawings";

export const VOYAGE_MODEL = "voyage-3.5-lite";

export const SEMANTIC_SIMILARITY_THRESHOLD_STRICT = 0.5;
export const SEMANTIC_SIMILARITY_THRESHOLD = 0.4;

export const HYBRID_VECTOR_WEIGHT = 0.7;
export const HYBRID_KEYWORD_WEIGHT = 0.3;

export const SEARCH_RESULT_LIMIT = 25;
export const SEARCH_FALLBACK_LIMIT = 15;

export const MIN_QUOTE_LENGTH = 50; // quotes can be shorter — "be water" is 2 words
export const MIN_SECTION_LENGTH = 150;

// VoyageAI supports up to ~64k chars per input
export const MAX_WHOLE_POST_LENGTH = 50000;

export const DELAY_BETWEEN_BATCHES = 200;
export const MAX_RETRIES = 5;
export const INITIAL_RETRY_DELAY = 2000;
export const API_TIMEOUT = 60000;

export const NUM_CLUSTERS = 15;
export const ANTHROPIC_CLUSTER_MODEL = "claude-haiku-4-5";
export const CLUSTER_LABEL_MAX_SAMPLES = 8;
export const CLUSTER_LABEL_MIN_SAMPLES = 3;
export const CLUSTER_LABEL_TIMEOUT = 30000;
