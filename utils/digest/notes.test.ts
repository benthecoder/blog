import { describe, expect, it } from "vitest";
import { journalPosts } from "./notes";
import { PERIODS } from "./periods";
import type { PostMetadata } from "@/types/post";

describe("digest formats", () => {
  it("still selects journal reflections after their journal tags are removed", () => {
    const post = (
      slug: string,
      format: PostMetadata["format"],
      title = slug
    ): PostMetadata => ({
      slug,
      title,
      format,
      date: "2026-10-01",
      tags: [],
      wordcount: 1,
      prev: null,
      next: null,
    });
    const posts = [
      post("011026", "journal"),
      post("021026", "essay"),
      post("trip", "journal"),
      post("031026", "links", "sunday links #17"),
      post("values", "essay"),
    ];
    expect(
      journalPosts(posts, new Date("2026-10-01"), new Date("2026-11-01")).map(
        (p) => p.slug
      )
    ).toEqual(["011026", "021026", "trip"]);
  });

  it("creates new sunday links with a format rather than format tags", async () => {
    const draft = await PERIODS.weekly.build({
      now: new Date(2026, 9, 4),
      days: 7,
      collectLinks: async () => [],
      nextIssue: () => 17,
    });
    expect(draft.format).toBe("links");
    expect(draft.tags).toBe("");
    expect(draft.title).toBe("sunday links #17");
  });
});
