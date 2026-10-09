import { createGoogle } from "@ai-sdk/google";
import { APICallError, generateText, Output, RetryError } from "ai";
import type { z } from "zod";
import { LLM_MODELS } from "../config/constants";

/** Thrown when the provider is still rate limiting after the SDK's retries. */
export class RateLimitError extends Error {}

// One provider, created lazily so importing this module never needs a key.
// Swapping providers later (e.g. AI Gateway "provider/model" strings) only
// changes `languageModel` below.
let provider: ReturnType<typeof createGoogle> | undefined;
function google() {
  provider ??= createGoogle({ apiKey: process.env.GEMINI_API_KEY });
  return provider;
}
const languageModel = (id: string) => google()(id);

export function hasLlmKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function rethrow(error: unknown): never {
  // after its retries the SDK wraps the last failure in a RetryError
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  if (APICallError.isInstance(cause) && cause.statusCode === 429) {
    throw new RateLimitError(cause.message);
  }
  throw error;
}

/**
 * One structured-output call, validated against a zod schema. The SDK retries
 * transient failures (including 429s) with backoff; what is left after that
 * surfaces as a RateLimitError or the original error.
 */
// Free-tier quotas are per model, so a model that runs dry hands over to the
// next one in LLM_MODELS for the rest of the process.
const exhausted = new Set<string>();

export async function generateStructured<T extends z.ZodType>({
  schema,
  prompt,
  models = LLM_MODELS,
  timeoutMs = 90_000,
  maxRetries = 1,
}: {
  schema: T;
  prompt: string;
  models?: string[];
  timeoutMs?: number;
  maxRetries?: number;
}): Promise<z.infer<T>> {
  for (const model of models) {
    if (exhausted.has(model)) continue;
    try {
      const { output } = await generateText({
        model: languageModel(model),
        output: Output.object({ schema }),
        prompt,
        maxRetries,
        abortSignal: AbortSignal.timeout(timeoutMs),
        temperature: 0.3,
        // flash models think first by default, which burns the output budget
        providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
      });
      return output as z.infer<T>;
    } catch (error) {
      try {
        rethrow(error);
      } catch (e) {
        if (!(e instanceof RateLimitError)) throw e;
        exhausted.add(model);
        console.warn(`  ${model} is rate limited; trying the next model`);
      }
    }
  }
  throw new RateLimitError("every configured model is rate limited");
}
