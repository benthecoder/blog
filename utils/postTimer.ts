type TimerStorage = Pick<Storage, "getItem" | "setItem">;

/** Accumulates time only for this mounted post, never time spent on other posts. */
export function createPostTimer(
  post: string,
  storage: TimerStorage,
  now = Date.now
) {
  const key = `blog-post-time:${post}`;
  let saved = 0;
  try {
    const value = Number(storage.getItem(key));
    if (Number.isFinite(value) && value > 0) saved = value;
  } catch {
    /* Storage may be unavailable. */
  }
  const started = now();
  const elapsed = () => saved + Math.max(0, now() - started);
  const checkpoint = () => {
    try {
      storage.setItem(key, String(elapsed()));
    } catch {
      /* Keep timing without persistence. */
    }
  };
  return { elapsed, checkpoint };
}
