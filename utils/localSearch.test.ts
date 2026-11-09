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
  it("matches whole words, so short words do not hit inside longer ones", () => {
    const songs = createLocalSearch([
      document("writing", "Small Writing Habits", "it is a way of writing"),
      document("hemingway", "Ernest Hemingway", "I want it that badly"),
      document("song", "Karaoke", "we sang I want it that way all night"),
      document("journal", "Tuesday", "I want it done, that is the way"),
    ]);
    expect(songs("i want it that way").map((r) => r.post_slug)).toEqual([
      "song",
      "journal",
    ]);
    expect(songs("wri").map((r) => r.post_slug)).toEqual(["writing"]);
    expect(songs("it way").map((r) => r.post_slug)).toContain("writing");
  });
});
