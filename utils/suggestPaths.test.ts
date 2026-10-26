import { describe, expect, it } from "vitest";
import { levenshtein, normalize, suggestPaths } from "./suggestPaths";

const entries = [
  { path: "/posts/fedex-marin-trip", title: "Fedex Marin Trip" },
  { path: "/posts/learning-to-cook", title: "Learning to Cook" },
  { path: "/posts/notes-on-sleep", title: "Notes on Sleep" },
  { path: "/wiki/spaced-repetition", title: "Spaced Repetition" },
  { path: "/essays/on-taste", title: "On Taste" },
  { path: "/posts", title: "posts" },
  { path: "/wiki", title: "wiki" },
  { path: "/about", title: "about" },
];

const top = (p: string) => suggestPaths(p, entries).map((e) => e.path);

describe("normalize", () => {
  it("lowercases, strips extensions and punctuation", () => {
    expect(normalize("Fedex_Marin-Trip.html")).toBe("fedex marin trip");
    expect(normalize("caf%C3%A9!")).toBe("café");
  });
});

describe("levenshtein", () => {
  it("counts edits", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("suggestPaths", () => {
  it("finds a truncated slug", () => {
    expect(top("/posts/fedex-marin")[0]).toBe("/posts/fedex-marin-trip");
  });

  it("finds a typo slug", () => {
    expect(top("/posts/learning-to-coook")[0]).toBe("/posts/learning-to-cook");
    expect(top("/wiki/spaced-repitition")[0]).toBe("/wiki/spaced-repetition");
  });

  it("maps /post/x to /posts/x", () => {
    expect(top("/post/notes-on-sleep")[0]).toBe("/posts/notes-on-sleep");
  });

  it("handles extensions and trailing junk", () => {
    expect(top("/posts/notes-on-sleep.html/")[0]).toBe("/posts/notes-on-sleep");
  });

  it("suggests the section page for a mistyped section", () => {
    expect(top("/post")).toContain("/posts");
    expect(top("/abuot")[0]).toBe("/about");
  });

  it("returns nothing for garbage", () => {
    expect(top("/posts/zzqxkvw")).toEqual([]);
    expect(top("/x")).toEqual([]);
    expect(top("/")).toEqual([]);
  });

  it("caps at three", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      path: `/posts/sleep-${i}`,
      title: `Sleep ${i}`,
    }));
    expect(suggestPaths("/posts/sleep", many).length).toBeLessThanOrEqual(3);
  });
});
