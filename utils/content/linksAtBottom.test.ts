import { describe, expect, it } from "vitest";
import { linksAtBottom, sundayLinksBeforeDailyLog } from "./linksAtBottom";
describe("links below the daily log", () => {
  it("moves the whole link section, including personal notes, below wake and meals", () => {
    const input =
      "My writing.\n\nlinks:\n- [article](https://example.com)\n  - my thought\n\n---\n\nwake: 0830  \nsleep: 0100\n\nmeals:\n- lunch: rice\n";
    expect(linksAtBottom(input)).toBe(
      "My writing.\n\n---\n\nwake: 0830  \nsleep: 0100\n\nmeals:\n- lunch: rice\n\nlinks:\n- [article](https://example.com)\n  - my thought\n"
    );
    expect(linksAtBottom(linksAtBottom(input))).toBe(linksAtBottom(input));
  });
  it("leaves already-bottom links and unrelated horizontal rules alone", () => {
    for (const body of [
      "wake: 0900\n\nlinks:\n- a\n",
      "links:\n- a\n\n---\n\nAn unrelated section.\n",
      "links:\n- a\n\n## New topic\n\n---\n\nwake: 0900\n",
    ])
      expect(linksAtBottom(body)).toBe(body);
  });
  it("does not mistake code examples for a links section", () => {
    const body = "```md\nlinks:\n- a\n\n---\n\nwake: 0900\n```\n";
    expect(linksAtBottom(body)).toBe(body);
  });
  it("preserves an appended Sunday Links section and all its contents", () => {
    const body =
      "links:\n- daily link\n\n---\n\nmeals:\n- dinner: noodles\n\n---\n\n## sunday links\n\n- weekly link\n";
    const result = linksAtBottom(body);
    expect(result).toContain("## sunday links\n\n- weekly link");
    expect(result.endsWith("links:\n- daily link\n")).toBe(true);
  });
});

describe("Sunday Links article and footer", () => {
  it("moves the main Sunday Links section ahead of the daily log, preserving notes", () => {
    const body =
      "brief update\n\n---\n\nwake: 0900\n\nmeals:\n- dinner: noodles\n\n## sunday links #18\n\n- [article](https://example.com)\n  my thought\n";
    const organized = sundayLinksBeforeDailyLog(body);
    expect(organized).toBe(
      "brief update\n\n## sunday links #18\n\n- [article](https://example.com)\n  my thought\n\n---\n\nwake: 0900\n\nmeals:\n- dinner: noodles\n"
    );
    expect(sundayLinksBeforeDailyLog(organized)).toBe(organized);
    expect(linksAtBottom(organized)).toBe(organized);
  });
});
