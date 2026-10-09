import { describe, expect, it, vi } from "vitest";
import { animateZoom, prefersReducedMotion } from "./mapZoom";

const from = { k: 1, x: 0, y: 0 };
const target = { k: 4, x: -300, y: -200 };

describe("prefersReducedMotion", () => {
  it("reads the media query through a matchMedia stub", () => {
    const stub = vi.fn((q: string) => ({
      matches: q === "(prefers-reduced-motion: reduce)",
    }));
    expect(prefersReducedMotion(stub)).toBe(true);
    expect(stub).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(prefersReducedMotion(() => ({ matches: false }))).toBe(false);
    expect(prefersReducedMotion(undefined)).toBe(false);
  });
});

describe("animateZoom", () => {
  it("jumps straight to the target with reduced motion, without scheduling frames", () => {
    const apply = vi.fn();
    const raf = vi.fn();
    animateZoom(from, target, apply, { reducedMotion: true, raf });
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(target);
    expect(raf).not.toHaveBeenCalled();
  });

  it("eases through intermediate frames otherwise and ends on the target", () => {
    const frames: ((t: number) => void)[] = [];
    const apply = vi.fn();
    animateZoom(from, target, apply, {
      reducedMotion: false,
      duration: 100,
      now: () => 0,
      raf: (cb) => frames.push(cb),
    });
    frames.shift()!(50);
    const mid = apply.mock.calls[0][0];
    expect(mid.k).toBeGreaterThan(1);
    expect(mid.k).toBeLessThan(4);
    frames.shift()!(100);
    expect(apply).toHaveBeenLastCalledWith(target);
    expect(frames).toHaveLength(0);
  });

  it("can be cancelled", () => {
    const cancel = vi.fn();
    const stop = animateZoom(from, target, vi.fn(), {
      reducedMotion: false,
      raf: () => 7,
      cancelRaf: cancel,
    });
    stop();
    expect(cancel).toHaveBeenCalledWith(7);
  });
});
