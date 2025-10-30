// Embedding config
export const EMBEDDING_DIMENSIONS = 1024;
export const VOYAGE_MODEL = "voyage-3.5-lite";
export const VOYAGE_INPUT_TYPE = "document";

// Semantic search thresholds
export const SEMANTIC_SIMILARITY_THRESHOLD_STRICT = 0.5;
export const SEMANTIC_SIMILARITY_THRESHOLD = 0.4;
export const CHAT_SIMILARITY_THRESHOLD = 0.3;

// Hybrid search weights
export const HYBRID_VECTOR_WEIGHT = 0.7;
export const HYBRID_KEYWORD_WEIGHT = 0.3;
export const TITLE_MATCH_MULTIPLIER = 2.0;

// Search result limits
export const SEARCH_RESULT_LIMIT = 25;
export const SEARCH_FALLBACK_LIMIT = 15;
export const CHAT_CONTEXT_LIMIT = 8;
export const TIME_QUERY_LIMIT = 12;

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

// Claude API config
export const CLAUDE_CHAT_MODEL = "claude-3-7-sonnet-latest";
export const CLAUDE_MAX_TOKENS = 1024;
export const CLAUDE_TEMPERATURE = 0.7;
export const CLAUDE_DATE_EXTRACTION_MAX_TOKENS = 150;
export const CLAUDE_DATE_EXTRACTION_TEMPERATURE = 0;
