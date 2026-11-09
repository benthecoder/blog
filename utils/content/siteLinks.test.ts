import fs from "fs";
import { describe, expect, it } from "vitest";
import { KNOWLEDGE_MAP_JSON } from "@/config/paths";
import type { KnowledgeMapOutput } from "@/types/knowledgeMap";
import { getPostContent, getPostMetadata, getPostSlugs } from "./posts";

describe("site links", () => {
  it("links every knowledge map point to a published post", () => {
    const slugs = new Set(getPostMetadata().map((post) => post.slug));
    const map: KnowledgeMapOutput = JSON.parse(
      fs.readFileSync(KNOWLEDGE_MAP_JSON, "utf8")
    );
    const missing = map.data
      .map((node) => node.postSlug)
      .filter((slug) => !slugs.has(slug));
    expect(missing).toEqual([]);
  });

  it("points internal post links at published posts", () => {
    const slugs = new Set(getPostSlugs());
    const broken = getPostSlugs().flatMap((slug) => {
      const { content } = getPostContent(slug);
      return [...content.matchAll(/\]\(\/posts\/([^)#?\s]+)/g)]
        .map((match) => match[1])
        .filter((target) => !slugs.has(target))
        .map((target) => `${slug} -> ${target}`);
    });
    expect(broken).toEqual([]);
  });
});
