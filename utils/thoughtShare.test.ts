import { describe, expect, it } from "vitest";
import { pageMetadata } from "./pageMetadata";
import {
  parseThoughtHash,
  parseThoughtId,
  thoughtAnchorId,
  THOUGHT_OG_TITLE_MAX,
  thoughtShareText,
  truncatePlainText,
} from "./thoughtShare";

describe("parseThoughtId", () => {
  it("accepts canonical positive integers and rejects the rest", () => {
    expect(parseThoughtId("1")).toBe(1);
    expect(parseThoughtId("1060")).toBe(1060);
    expect(parseThoughtId("0")).toBeNull();
    expect(parseThoughtId("0123")).toBeNull();
    expect(parseThoughtId("-1")).toBeNull();
    expect(parseThoughtId("1.5")).toBeNull();
    expect(parseThoughtId("t-1060")).toBeNull();
    expect(parseThoughtId("")).toBeNull();
  });
});

describe("thought anchors", () => {
  it("round-trips a stream hash", () => {
    expect(thoughtAnchorId(1060)).toBe("t-1060");
    expect(parseThoughtHash("#t-1060")).toBe(1060);
    expect(parseThoughtHash("t-1060")).toBe(1060);
    expect(parseThoughtHash("#t-0123")).toBeNull();
    expect(parseThoughtHash("#thought-1060")).toBeNull();
    expect(parseThoughtHash("#")).toBeNull();
  });
});

describe("truncatePlainText", () => {
  it("keeps short text and cuts long text at a word", () => {
    expect(truncatePlainText("buen provecho")).toBe("buen provecho");
    const long =
      "verification is the new bottleneck. the main constraint now is how quickly you can verify results and ambition scales with verifiability.";
    const cut = truncatePlainText(long);
    expect(cut.endsWith("…")).toBe(true);
    expect(cut.length).toBeLessThanOrEqual(THOUGHT_OG_TITLE_MAX);
    expect(cut).not.toMatch(/\s…$/);
  });
});

describe("thoughtShareText", () => {
  it("strips markdown, substitutes titled links, and truncates", () => {
    expect(
      thoughtShareText({
        content: "need to be **funmaxxing** more",
        link: null,
        titles: {},
      })
    ).toBe("need to be funmaxxing more");

    expect(
      thoughtShareText({
        content: `- verification is the new bottleneck
- see https://www.anthropic.com/research/migrating-api-to-rust`,
        link: null,
        titles: {
          "https://www.anthropic.com/research/migrating-api-to-rust":
            "Migrating our Messages API to Rust",
        },
      })
    ).toBe(
      "verification is the new bottleneck see Migrating our Messages API to Rust"
    );

    expect(
      thoughtShareText({
        content: "",
        link: "https://www.anthropic.com/research/migrating-api-to-rust",
        titles: {
          "https://www.anthropic.com/research/migrating-api-to-rust":
            "Migrating our Messages API to Rust",
        },
      })
    ).toBe("Migrating our Messages API to Rust");

    expect(thoughtShareText({ content: "", link: null, titles: {} })).toBe(
      "a thought"
    );
  });

  it("feeds the existing og route through pageMetadata", () => {
    const title = thoughtShareText({
      content: "until death, all defeat is psychological",
      link: null,
      titles: {},
    });
    const meta = pageMetadata({
      title,
      description: "a thought",
      path: "/thoughts/1040",
    });
    expect(meta.title).toBe("until death, all defeat is psychological");
    const images = meta.openGraph?.images as { url: string }[];
    expect(images[0].url).toBe(
      "/og?title=until%20death%2C%20all%20defeat%20is%20psychological"
    );
    expect(meta.openGraph?.url).toMatch(/\/thoughts\/1040$/);
  });
});
