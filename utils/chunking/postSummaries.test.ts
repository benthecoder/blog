import { describe, expect, it } from "vitest";
import { readFrontmatter } from "./postSummaries";

describe("readFrontmatter", () => {
  it("keeps quotes inside a title", () => {
    // From posts/fail.md; the old line regex dropped the closing quote.
    const markdown = `---\ntitle: Stop saying "Fail"\ndate: May 1, 2023\n---\nbody`;
    expect(readFrontmatter(markdown, "fail.md").title).toBe(
      'Stop saying "Fail"'
    );
  });

  it("reads tags written as a folded block", () => {
    // From posts/reliableds.md; the old regex read the tags as ">-".
    const markdown =
      "---\ntitle: t\ndate: May 1, 2023\ntags: >-\n  data-science,\n  software-design\n---\nbody";
    expect(readFrontmatter(markdown, "reliableds.md").tags).toBe(
      "data-science, software-design"
    );
  });

  it("names the post when its frontmatter is wrong", () => {
    expect(() => readFrontmatter("---\ntitle: t\n---\n", "bad.md")).toThrow(
      "bad.md: invalid frontmatter\ndate: required"
    );
  });
});
