import { describe, it, expect } from "vitest";
import { createResolver } from "./resolve";
import type { LinkableEntry } from "@/types/links";

const wiki = (slug: string, title: string): LinkableEntry => ({
  ref: { kind: "wiki", slug },
  title,
  href: `/wiki/${slug}`,
});
const post = (slug: string, title: string): LinkableEntry => ({
  ref: { kind: "post", slug },
  title,
  href: `/posts/${slug}`,
});

describe("createResolver", () => {
  const entries = [
    wiki("kalman-filter", "Kalman filter"),
    post("070226", "On sensor fusion"),
  ];
  const resolve = createResolver(entries);

  it("matches by title, case- and space-insensitively", () => {
    expect(resolve("Kalman filter")?.ref.slug).toBe("kalman-filter");
    expect(resolve("  kalman   FILTER ")?.ref.slug).toBe("kalman-filter");
  });

  it("falls back to slug when no title matches", () => {
    expect(resolve("kalman-filter")?.ref.slug).toBe("kalman-filter");
    expect(resolve("070226")?.ref.kind).toBe("post");
  });

  it("returns null for an unknown target", () => {
    expect(resolve("does not exist")).toBeNull();
  });

  it("prefers title over slug on conflict", () => {
    // A page titled "070226" should win over the post whose slug is "070226".
    const r = createResolver([
      post("070226", "On sensor fusion"),
      wiki("x", "070226"),
    ]);
    expect(r("070226")?.ref.slug).toBe("x");
  });

  it("first entry wins on duplicate titles (caller controls order)", () => {
    const r = createResolver([wiki("a", "Dup"), post("b", "Dup")]);
    expect(r("Dup")?.ref.slug).toBe("a");
  });
});
