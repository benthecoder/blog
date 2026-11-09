import { describe, expect, it } from "vitest";
import { highlightMatcher, searchTerms, termMatchers } from "./searchTerms";

const marks = (query: string, text: string) => {
  const matcher = highlightMatcher(searchTerms(query));
  return matcher ? [...text.matchAll(matcher)].map((m) => m[0]) : [];
};

describe("search terms", () => {
  it("splits, lowercases, dedupes, and drops a leading #", () => {
    expect(searchTerms("  #Travel  travel Taipei ")).toEqual([
      "travel",
      "taipei",
    ]);
  });

  it("matches word starts, and short words or stopwords only whole", () => {
    const [it_, way, japan] = termMatchers(["it", "way", "japan"]);
    expect(japan.test("Japanese tea")).toBe(true);
    expect(it_.test("writing")).toBe(false);
    expect(it_.test("it's")).toBe(false);
    expect(it_.test("It works")).toBe(true);
    expect(way.test("Hemingway")).toBe(false);
    expect(way.test("ways")).toBe(true);
  });

  it("keeps unspaced scripts as substrings", () => {
    expect(termMatchers(["台北"])[0].test("我在台北")).toBe(true);
  });

  it("does not mark stopwords or fragments in multi-word queries", () => {
    expect(
      marks("i want it that way", "I've been writing; I want it that way.")
    ).toEqual(["want", "way"]);
    expect(marks("it", "It is writing")).toEqual(["It"]);
    expect(marks("the that", "the end")).toEqual(["the"]);
  });
  it("stays reusable after String.search, as snippets then highlights use it", () => {
    const matcher = highlightMatcher(searchTerms("i want it that way"))!;
    const text = "Writing it all down. His way, my way.";
    expect(text.search(matcher)).toBe(25);
    expect([...text.matchAll(matcher)].map((m) => m.index)).toEqual([25, 33]);
  });
});
