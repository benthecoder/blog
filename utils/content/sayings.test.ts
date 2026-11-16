import { describe, expect, it } from "vitest";
import { BELIEVE_MD, VERSES_MD, WORDS_MD } from "@/config/paths";
import { readMarkdownFile } from "./markdown";
import { bodyOnlySchema } from "./schemas";
import { parseSayings } from "./sayings";
import { parseBeliefs } from "./beliefs";

describe("parseSayings", () => {
  it("reads topics and cited entries", () => {
    expect(
      parseSayings(`## on rest

Come to me, all you who are weary,
and I will give you rest.
— Matthew 11:28

## on time
How we spend our days is how we spend our lives.
-- Annie Dillard, The Writing Life`)
    ).toEqual([
      {
        id: "on-rest",
        title: "on rest",
        sayings: [
          {
            text: "Come to me, all you who are weary, and I will give you rest.",
            cite: "Matthew 11:28",
          },
        ],
      },
      {
        id: "on-time",
        title: "on time",
        sayings: [
          {
            text: "How we spend our days is how we spend our lives.",
            cite: "Annie Dillard",
            work: "The Writing Life",
          },
        ],
      },
    ]);
  });

  it.each([
    ["an uncited entry", "## a\n\nno cite here"],
    ["an entry before a topic", "text\n— someone"],
    ["an empty topic", "## a\n\n## b\n\ntext\n— someone"],
  ])("rejects %s", (_, markdown) => {
    expect(() => parseSayings(markdown)).toThrow();
  });

  // The published files: anything that adds to them must keep the shape.
  it.each([WORDS_MD, VERSES_MD])("%s parses", (file) => {
    const { content } = readMarkdownFile(file, bodyOnlySchema);
    expect(parseSayings(content).length).toBeGreaterThan(0);
  });

  it("believe.md parses", () => {
    const { content } = readMarkdownFile(BELIEVE_MD, bodyOnlySchema);
    expect(parseBeliefs(content).length).toBeGreaterThan(0);
  });
});

describe("parseBeliefs", () => {
  it("reads beliefs with their reasons", () => {
    expect(parseBeliefs("- a\n  - why a\n- b")).toEqual([
      { text: "a", reasons: ["why a"] },
      { text: "b", reasons: [] },
    ]);
  });

  it.each(["  - a reason first", "a loose line"])("rejects %s", (md) => {
    expect(() => parseBeliefs(md)).toThrow();
  });
});
