import {
  MAX_RETRIES,
  INITIAL_RETRY_DELAY,
  API_TIMEOUT,
} from "@/config/constants";

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRIABLE_ERROR_CODES = [
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNREFUSED",
];
const RETRIABLE_ERROR_MESSAGES = ["timeout", "network", "rate limit"];

function isRetriableError(error: any): boolean {
  if (error?.response?.status === 429) return true;
  if (error?.code && RETRIABLE_ERROR_CODES.includes(error.code)) return true;
  const errorMessage = error?.message?.toLowerCase() || "";
  return RETRIABLE_ERROR_MESSAGES.some((msg) => errorMessage.includes(msg));
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  timeout?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

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
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
      });
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error: any) {
      lastError = error;
      if (attempt >= maxRetries || !shouldRetry(error)) throw error;
      const delay = initialDelay * Math.pow(2, attempt);
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      } else {
        console.log(
          `Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`
        );
      }
      await wait(delay);
    }
  }

  throw lastError;
}

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
