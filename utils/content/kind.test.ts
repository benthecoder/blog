import path from "path";
import { describe, expect, it } from "vitest";
import { contentPaths, parseKind } from "./kind";

describe("content kind", () => {
  it("defaults to post and rejects unknown kinds", () => {
    expect(parseKind(null)).toBe("post");
    expect(parseKind(undefined)).toBe("post");
    expect(parseKind("")).toBe("post");
    expect(parseKind("post")).toBe("post");
    expect(parseKind("essay")).toBe("essay");
    expect(parseKind("wiki")).toBeNull();
    expect(parseKind("../posts")).toBeNull();
    expect(parseKind(1)).toBeNull();
  });

  it("maps kinds to their draft and published folders", () => {
    const post = contentPaths("post");
    expect(post.draftPath("x")).toBe(
      path.join(process.cwd(), "posts", "drafts", "x.md")
    );
    expect(post.publishedPath("x")).toBe(
      path.join(process.cwd(), "posts", "x.md")
    );
    const essay = contentPaths("essay");
    expect(essay.draftPath("x")).toBe(
      path.join(process.cwd(), "essays", "drafts", "x.md")
    );
    expect(essay.publishedPath("x")).toBe(
      path.join(process.cwd(), "essays", "x.md")
    );
  });

  it("still rejects unsafe slugs for essays", () => {
    expect(() => contentPaths("essay").draftPath("../x")).toThrow();
  });
});
