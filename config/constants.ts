// Embedding config
export const EMBEDDING_DIMENSIONS = 1024;
export const VOYAGE_MODEL = "voyage-3-lite";
export const VOYAGE_INPUT_TYPE = "document";

// Semantic search thresholds
export const SEMANTIC_SIMILARITY_THRESHOLD_STRICT = 0.5;
export const SEMANTIC_SIMILARITY_THRESHOLD = 0.4;
export const SEMANTIC_SIMILARITY_THRESHOLD_LENIENT = 0.3;
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

// Markdown chunking
export const MIN_CHUNK_LENGTH = 150;
export const MAX_CHUNK_LENGTH = 600;
export const TARGET_CHUNK_LENGTH = 200;
export const MIN_STANDALONE_CHUNK = 10;
export const CHUNK_OVERLAP_PERCENTAGE = 0.3;
export const CHUNK_OVERLAP_MIN_CHARS = 100;
export const CHUNK_OVERLAP_MAX_CHARS = 200;
export const OVERLAP_DETECTION_THRESHOLD = 100;
export const MIN_BULLET_POINTS = 3;
export const MIN_WORD_COUNT = 3;
export const MAX_CONTEXT_PARAGRAPHS = 2;
export const MAX_OVERLAP_SENTENCES = 2;

// Whole post embedding
export const MAX_WHOLE_POST_LENGTH = 8000;

// Rate limiting & batching
export const EMBEDDING_BATCH_SIZE = 15;
export const DELAY_BETWEEN_BATCHES = 500;
export const DELAY_BETWEEN_FILES = 1500;
export const MAX_RETRIES = 5;
export const INITIAL_RETRY_DELAY = 2000;
export const API_TIMEOUT = 60000;

// Claude API config
export const CLAUDE_CHAT_MODEL = "claude-3-7-sonnet-latest";
export const CLAUDE_MAX_TOKENS = 1024;
export const CLAUDE_TEMPERATURE = 0.7;
export const CLAUDE_DATE_EXTRACTION_MAX_TOKENS = 150;
export const CLAUDE_DATE_EXTRACTION_TEMPERATURE = 0;
