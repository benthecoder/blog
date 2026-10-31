import { describe, expect, it, vi } from "vitest";
import { buildSearchDocuments } from "./searchIndex";
import { scanMarkdownDir } from "./markdown";
import { POSTS_DIR } from "@/config/paths";
vi.mock("./markdown", () => ({
  scanMarkdownDir: vi.fn(() => [
    {
      slug: "public",
      data: {
        title: "Public",
        date: "2026-01-01",
        tags: ["coding"],
        secret: "do not serialize",
      },
      content:
        "# Hello\n\n[world](https://example.com) <!-- hidden -->\n```js\nconst x = 1;\n```",
    },
  ]),
}));

describe("published search index", () => {
  it("uses the shared reader on the published directory only and whitelists fields", () => {
    const documents = buildSearchDocuments();
    expect(scanMarkdownDir).toHaveBeenCalledExactlyOnceWith(POSTS_DIR);
    expect(documents[0]).toMatchObject({
      post_slug: "public",
      post_title: "Public",
      tags: ["coding"],
    });
    expect(documents[0].content).toContain("const x = 1;");
    expect(documents[0].content).not.toContain("hidden");
    expect(JSON.stringify(documents)).not.toContain("do not serialize");
  });
});
