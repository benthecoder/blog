import { describe, expect, it } from "vitest";
import { splitLeadingImage } from "./hero";

describe("splitLeadingImage", () => {
  it("splits a leading image from the body", () => {
    const md = "![The School of Athens](/images/athens.jpeg)\n\nFirst para.\n";
    expect(splitLeadingImage(md)).toEqual({
      hero: "![The School of Athens](/images/athens.jpeg)",
      body: "\nFirst para.\n",
    });
  });

  it("skips blank lines before the image", () => {
    const md = "\n\n![alt](/img.png)\ntext";
    expect(splitLeadingImage(md).hero).toBe("![alt](/img.png)");
  });

  it("returns null hero when the post starts with text", () => {
    const md = "Hello.\n\n![alt](/img.png)\n";
    expect(splitLeadingImage(md)).toEqual({ hero: null, body: md });
  });

  it("ignores images that share a line with other text", () => {
    const md = "intro ![alt](/img.png)\n";
    expect(splitLeadingImage(md).hero).toBeNull();
  });
});
