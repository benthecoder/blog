export interface ZoomState {
  k: number;
  x: number;
  y: number;
}

export function prefersReducedMotion(
  matchMedia: ((query: string) => { matches: boolean }) | undefined
): boolean {
  return Boolean(matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;

/**
 * Move from one zoom state to another. With reduced motion it jumps straight
 * to the target in a single call; otherwise it eases over `duration` ms.
 * Returns a function that cancels a running animation.
 */
export function animateZoom(
  from: ZoomState,
  target: ZoomState,
  apply: (state: ZoomState) => void,
  {
    reducedMotion,
    duration = 550,
    raf = (cb) => requestAnimationFrame(cb),
    cancelRaf = (id) => cancelAnimationFrame(id),
    now = () => performance.now(),
  }: {
    reducedMotion: boolean;
    duration?: number;
    raf?: (cb: (t: number) => void) => number;
    cancelRaf?: (id: number) => void;
    now?: () => number;
  }
): () => void {
  if (reducedMotion) {
    apply(target);
    return () => {};
  }
  const start = now();
  let id = 0;
  const step = (t: number) => {
    const p = Math.min(1, Math.max(0, (t - start) / duration));
    const e = easeInOutCubic(p);
    apply({
      k: from.k + (target.k - from.k) * e,
      x: from.x + (target.x - from.x) * e,
      y: from.y + (target.y - from.y) * e,
    });
    if (p < 1) id = raf(step);
  };
  id = raf(step);
  return () => cancelRaf(id);
}
