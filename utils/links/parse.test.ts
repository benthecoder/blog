import { describe, it, expect } from "vitest";
import { parseWikiLinks, splitOnWikiLinks } from "./parse";

describe("parseWikiLinks", () => {
  it("parses a bare link, label defaults to target", () => {
    expect(parseWikiLinks("see [[Kalman filter]] here")).toEqual([
      { target: "Kalman filter", label: "Kalman filter" },
    ]);
  });

  it("parses a piped label", () => {
    expect(parseWikiLinks("[[Kalman filter|the filter]]")).toEqual([
      { target: "Kalman filter", label: "the filter" },
    ]);
  });

  it("trims target and label", () => {
    expect(parseWikiLinks("[[  a  |  b  ]]")).toEqual([
      { target: "a", label: "b" },
    ]);
  });

  it("finds multiple links in order", () => {
    expect(parseWikiLinks("[[a]] and [[b|B]]").map((l) => l.target)).toEqual([
      "a",
      "b",
    ]);
  });

  it("ignores empty targets", () => {
    expect(parseWikiLinks("[[]] and [[ | x ]]")).toEqual([]);
  });

  it("returns nothing for plain text", () => {
    expect(parseWikiLinks("no links [ single ] here")).toEqual([]);
  });
});

describe("splitOnWikiLinks", () => {
  it("interleaves text and link segments", () => {
    expect(splitOnWikiLinks("a [[b]] c")).toEqual([
      { type: "text", value: "a " },
      { type: "link", link: { target: "b", label: "b" } },
      { type: "text", value: " c" },
    ]);
  });

  it("keeps an empty-target `[[]]` as literal text", () => {
    expect(splitOnWikiLinks("x [[]] y")).toEqual([
      { type: "text", value: "x [[]] y" },
    ]);
  });

  it("handles a link at the very start and end", () => {
    expect(splitOnWikiLinks("[[a]][[b]]")).toEqual([
      { type: "link", link: { target: "a", label: "a" } },
      { type: "link", link: { target: "b", label: "b" } },
    ]);
  });
});
