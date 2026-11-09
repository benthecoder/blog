import "server-only";
import { upstashPipeline } from "@/utils/upstash";

const TIMEOUT_MS = 500;
type RateLimitResult =
  | { ok: true; retryAfter: number }
  | { ok: false; retryAfter: number; reason: "limit" | "unavailable" };

export const rateLimitKey = (
  scope: string,
  viewer: string,
  nowMs: number,
  windowSeconds: number
) => `ratelimit:${scope}:${viewer}:${Math.floor(nowMs / 1000 / windowSeconds)}`;

export const retryAfterSeconds = (nowMs: number, windowSeconds: number) =>
  windowSeconds - (Math.floor(nowMs / 1000) % windowSeconds);

/** Fixed-window per-viewer limit. Read routes fail open by default; credential endpoints can opt to fail closed. */
export async function checkRateLimit({
  scope,
  viewer,
  limit,
  windowSeconds,
  failOpen = true,
}: {
  scope: string;
  viewer: string;
  limit: number;
  windowSeconds: number;
  failOpen?: boolean;
}): Promise<RateLimitResult> {
  const now = Date.now();
  const retryAfter = retryAfterSeconds(now, windowSeconds);
  const key = rateLimitKey(scope, viewer, now, windowSeconds);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const [count] = await Promise.race([
      upstashPipeline([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
      ]),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
      }),
    ]);
    return Number(count) <= limit
      ? { ok: true, retryAfter }
      : { ok: false, retryAfter, reason: "limit" };
  } catch {
    return failOpen
      ? { ok: true, retryAfter }
      : { ok: false, retryAfter, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
