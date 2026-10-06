import { describe, expect, it, vi } from "vitest";
import { buildRssFeed, RSS_POST_LIMIT } from "./rss";
import type { PostMetadata } from "@/types/post";
const post = (slug: string): PostMetadata => ({
  slug,
  title: "A title",
  date: "2026-10-06",
  tags: [],
  wordcount: 1,
  prev: null,
  next: null,
});

describe("RSS feed", () => {
  it("reads only the newest 50 articles while keeping full content", () => {
    const read = vi.fn(
      () => "A full article.\n\n" + "More writing. ".repeat(100)
    );
    const rss = buildRssFeed(
      Array.from({ length: 80 }, (_, i) => post(String(i))),
      read
    );
    expect(read).toHaveBeenCalledTimes(RSS_POST_LIMIT);
    expect(read).not.toHaveBeenCalledWith("50");
    expect(rss.match(/<item>/g)).toHaveLength(50);
    expect(rss).toContain("More writing. ".repeat(100).trim());
    for (const description of rss.matchAll(
      /<description>(.*?)<\/description>/gs
    ))
      expect(description[1].length).toBeLessThan(260);
  });
  it("protects CDATA titles and makes image addresses absolute", () => {
    const rss = buildRssFeed(
      [{ ...post("test"), title: "a ]]> b" }],
      () => "![Flower](/images/flower.png)"
    );
    expect(rss).toContain("a ]]]]><![CDATA[> b");
    expect(rss).toContain('src="https://bneo.xyz/images/flower.png"');
    expect(rss).toContain("<guid>https://bneo.xyz/posts/test</guid>");
  });
  it("supports an empty archive", () => {
    const read = vi.fn();
    expect(buildRssFeed([], read)).not.toContain("Invalid Date");
    expect(read).not.toHaveBeenCalled();
  });
});
