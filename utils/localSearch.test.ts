import { describe, expect, it } from "vitest";
import { createLocalSearch, type SearchDocument } from "./localSearch";

const document = (
  slug: string,
  title: string,
  content: string,
  tags: string[] = []
): SearchDocument => ({ post_slug: slug, post_title: title, content, tags });

describe("local search", () => {
  const search = createLocalSearch([
    document("body", "My day", "I love programming in Taipei", ["travel"]),
    document("title", "Programming", "Notes", ["software"]),
    document("unicode", "台北", "咖啡 and crème brûlée", ["food"]),
  ]);
  it("ranks titles above body matches and matches while typing", () => {
    expect(search("progr").map((r) => r.post_slug)).toEqual(["title", "body"]);
  });
  it("requires every term, across fields", () => {
    expect(search("travel taipei").map((r) => r.post_slug)).toEqual(["body"]);
    expect(search("travel missing")).toEqual([]);
  });
  it("restricts hashtag queries to topics", () => {
    expect(search("#trav").map((r) => r.post_slug)).toEqual(["body"]);
    expect(search("#programming")).toEqual([]);
  });
  it("handles Unicode, literal punctuation, clearing, and limits", () => {
    expect(search("台北")[0].post_slug).toBe("unicode");
    expect(search("crème")[0].post_slug).toBe("unicode");
    expect(search("[.*")).toEqual([]);
    expect(search("  ")).toEqual([]);
    expect(search("progr", 1)).toHaveLength(1);
    expect(search("#")).toEqual([]);
  });
});
