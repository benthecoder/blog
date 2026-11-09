import { describe, expect, it } from "vitest";
import { entryLines, shortDefinition, synonymParts } from "./dictionaryEntry";

describe("dictionary entries", () => {
  it("breaks senses and antonyms onto their own lines", () => {
    expect(entryLines("light noun 1 glow • beam ANTONYMS dark")).toEqual([
      "light noun",
      "1 glow",
      "• beam",
      "antonyms: dark",
    ]);
  });

  it("shortens to the first sense", () => {
    expect(
      shortDefinition("light | lait | noun 1 the glow of a lamp • a lamp")
    ).toBe("the glow of a lamp");
    expect(shortDefinition("• " + "a".repeat(200), 10)).toBe("aaaaaaaaaa…");
  });

  it("marks only plain words as swappable", () => {
    expect(synonymParts("1 glow, bright light; (informal) lamp")).toEqual([
      { text: "glow", swappable: true },
      { text: ", ", swappable: false },
      { text: "bright light", swappable: true },
      { text: "; ", swappable: false },
      { text: "(informal) lamp", swappable: false },
    ]);
  });
});
