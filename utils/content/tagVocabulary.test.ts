import { describe, expect, it } from "vitest";
import { POSTS_DIR } from "@/config/paths";
import { scanMarkdownDir } from "./markdown";
import { postFrontmatterSchema } from "./schemas";
import { parseTags } from "./tags";

// A tag says what a post is about. A passing mention ("went to church",
// one verse, one quote) never earns one, and journal days get 0-2 tags.
// Tags on fewer than 3 posts are pinned below so a new one is a deliberate
// choice: if this fails, either reuse an existing tag or run
// `pnpm vitest -u utils/content/tagVocabulary.test.ts` to accept it.
describe("tag vocabulary", () => {
  const counts = new Map<string, number>();
  for (const { data } of scanMarkdownDir(POSTS_DIR, postFrontmatterSchema))
    for (const tag of parseTags(data.tags))
      if (tag) counts.set(tag, (counts.get(tag) ?? 0) + 1);

  it("uses no placeholder or format tags", () => {
    const bad = ["-", "journal", "christianity"].filter((t) => counts.has(t));
    expect(bad).toEqual([]);
  });

  it("adds rare tags only on purpose", () => {
    const rare = [...counts]
      .filter(([, n]) => n < 3)
      .map(([tag]) => tag)
      .sort();
    expect(rare).toMatchSnapshot();
  });
});
