import { describe, expect, it } from "vitest";
import { swipeDirection } from "./swipe";

describe("swipeDirection", () => {
  it("maps left swipe to next and right swipe to previous", () => {
    expect(swipeDirection(-80, 5, 200)).toBe(1);
    expect(swipeDirection(80, -5, 200)).toBe(-1);
  });

  it("ignores short, slow, or diagonal gestures", () => {
    expect(swipeDirection(-40, 0, 100)).toBe(0);
    expect(swipeDirection(-100, 0, 700)).toBe(0);
    expect(swipeDirection(-100, 80, 200)).toBe(0);
  });
});
