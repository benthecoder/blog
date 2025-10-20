/**
 * Generic retry utilities with exponential backoff
 * Reusable across different API operations
 */

import {
  MAX_RETRIES,
  INITIAL_RETRY_DELAY,
  API_TIMEOUT,
} from "@/config/constants";

/**
 * Wait for a specified number of milliseconds
 * @param ms - Milliseconds to wait
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Error types that should trigger a retry
 */
const RETRIABLE_ERROR_CODES = [
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNREFUSED",
];
const RETRIABLE_ERROR_MESSAGES = ["timeout", "network", "rate limit"];

/**
 * Determine if an error is retriable
 * @param error - Error object to check
 * @returns True if the error should be retried
 */
function isRetriableError(error: any): boolean {
  // Check for rate limiting (HTTP 429)
  if (error?.response?.status === 429) {
    return true;
  }

  // Check for known error codes
  if (error?.code && RETRIABLE_ERROR_CODES.includes(error.code)) {
    return true;
  }

  // Check for error messages
  const errorMessage = error?.message?.toLowerCase() || "";
  return RETRIABLE_ERROR_MESSAGES.some((msg) => errorMessage.includes(msg));
}

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retries (default: MAX_RETRIES from config) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: INITIAL_RETRY_DELAY from config) */
  initialDelay?: number;
  /** Timeout for each attempt in milliseconds (default: API_TIMEOUT from config) */
  timeout?: number;
  /** Custom function to determine if an error should be retried */
  shouldRetry?: (error: any) => boolean;
  /** Callback for retry attempts */
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

/**
 * Execute an async operation with automatic retry and exponential backoff
 *
 * @param operation - Async function to execute
 * @param options - Retry configuration options
 * @returns Result of the operation
 * @throws Error if all retries are exhausted
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    timeout = API_TIMEOUT,
    shouldRetry = isRetriableError,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
      });

      // Race between operation and timeout
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error: any) {
      lastError = error;

      // If we've exhausted retries or error is not retriable, throw
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      } else {
        // Default logging
        console.log(
          `Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`
        );
      }

      // Wait before retrying
      await wait(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Specialized retry function for embedding generation
 * Wraps withRetry with embedding-specific defaults
 *
 * @param operation - Embedding generation operation
 * @returns Result of the operation
 */
export async function withEmbeddingRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  return withRetry(operation, {
    onRetry: (error, attempt, delay) => {
      if (error?.response?.status === 429) {
        console.log(
          `Rate limited. Waiting ${delay}ms before retry ${attempt}/${MAX_RETRIES}`
        );
      } else {
        console.log(
          `Request failed with error: ${error.message}. Waiting ${delay}ms before retry ${attempt}/${MAX_RETRIES}`
        );
      }
    },
  });
}
