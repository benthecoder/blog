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

function isRetriableError(error: unknown): boolean {
  const e = error as Record<string, unknown> | null;
  if ((e?.response as Record<string, unknown>)?.status === 429) return true;
  if (e?.code && RETRIABLE_ERROR_CODES.includes(e.code as string)) return true;
  const errorMessage = ((e?.message as string | undefined) ?? "").toLowerCase();
  return RETRIABLE_ERROR_MESSAGES.some((msg) => errorMessage.includes(msg));
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  timeout?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
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

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeout);
      });
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !shouldRetry(error)) throw error;
      const delay = initialDelay * Math.pow(2, attempt);
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(
          `Attempt ${attempt + 1}/${maxRetries} failed: ${msg}. Retrying in ${delay}ms...`
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
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 429) {
        console.log(
          `Rate limited. Waiting ${delay}ms before retry ${attempt}/${MAX_RETRIES}`
        );
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(
          `Request failed with error: ${msg}. Waiting ${delay}ms before retry ${attempt}/${MAX_RETRIES}`
        );
      }
    },
  });
}
