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
  const e = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
    code?: unknown;
    message?: unknown;
  } | null;
  const status = e?.statusCode ?? e?.status ?? e?.response?.status;
  if (
    status === 429 ||
    (typeof status === "number" && status >= 500 && status < 600)
  )
    return true;
  if (typeof e?.code === "string" && RETRIABLE_ERROR_CODES.includes(e.code))
    return true;
  const message = typeof e?.message === "string" ? e.message.toLowerCase() : "";
  return RETRIABLE_ERROR_MESSAGES.some((part) => message.includes(part));
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  timeout?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

export async function withRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
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
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            const error = Object.assign(new Error("Request timed out"), {
              code: "ETIMEDOUT",
            });
            controller.abort(error);
            reject(error);
          }, timeout);
        });
        return await Promise.race([
          operation(controller.signal),
          timeoutPromise,
        ]);
      } finally {
        clearTimeout(timer);
      }
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
  operation: (signal: AbortSignal) => Promise<T>
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
