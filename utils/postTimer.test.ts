import { describe, expect, it } from "vitest";
import { createPostTimer } from "./postTimer";

describe("per-post editing time", () => {
  it("starts each post separately and resumes without counting time on another post", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    let now = 1000;
    const first = createPostTimer("post:010326", storage, () => now);
    now += 15000;
    first.checkpoint();
    const second = createPostTimer("post:020326", storage, () => now);
    expect(second.elapsed()).toBe(0);
    now += 60000;
    second.checkpoint();
    const resumed = createPostTimer("post:010326", storage, () => now);
    expect(resumed.elapsed()).toBe(15000);
    now += 2000;
    expect(resumed.elapsed()).toBe(17000);
  });
  it("ignores malformed storage and works when storage is blocked", () => {
    let now = 0;
    const timer = createPostTimer(
      "post:test",
      {
        getItem: () => "NaN",
        setItem: () => {
          throw Error("blocked");
        },
      },
      () => now
    );
    now = 2000;
    expect(timer.elapsed()).toBe(2000);
    expect(() => timer.checkpoint()).not.toThrow();
  });
});
