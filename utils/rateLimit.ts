import "server-only";
import { upstashPipeline } from "@/utils/upstash";

const TIMEOUT_MS = 500;

export const rateLimitKey = (
  scope: string,
  viewer: string,
  nowMs: number,
  windowSeconds: number
) => `ratelimit:${scope}:${viewer}:${Math.floor(nowMs / 1000 / windowSeconds)}`;

export const retryAfterSeconds = (nowMs: number, windowSeconds: number) =>
  windowSeconds - (Math.floor(nowMs / 1000) % windowSeconds);

/** Fixed-window per-viewer limit. Fails open so Redis trouble never blocks the route. */
export async function checkRateLimit({
  scope,
  viewer,
  limit,
  windowSeconds,
}: {
  scope: string;
  viewer: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ ok: boolean; retryAfter: number }> {
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
    return { ok: Number(count) <= limit, retryAfter };
  } catch {
    return { ok: true, retryAfter };
  } finally {
    clearTimeout(timer);
  }
}
