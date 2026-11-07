import { describe, expect, it } from "vitest";
import { imageRange, postImages } from "./postImages";

const doc =
  "intro\n\n![](/images/a-1.jpg)\n\nmiddle\n\n![x](/images/drafts/a-2.jpg)";

describe("post images", () => {
  it("lists local images once, in order, with their file names", () => {
    expect(
      postImages(doc + "\n\n![](/images/a-1.jpg)\n![](https://x.dev/y.jpg)")
    ).toEqual([
      { url: "/images/a-1.jpg", name: "a-1.jpg" },
      { url: "/images/drafts/a-2.jpg", name: "a-2.jpg" },
    ]);
  });

  it("cuts an image with the blank line after it", () => {
    const range = imageRange(doc, "/images/a-1.jpg")!;
    expect(doc.slice(0, range.from) + doc.slice(range.to)).toBe(
      "intro\n\nmiddle\n\n![x](/images/drafts/a-2.jpg)"
    );
  });

  it("cuts the blank line before an image that ends the document", () => {
    const range = imageRange(doc, "/images/drafts/a-2.jpg")!;
    expect(doc.slice(0, range.from) + doc.slice(range.to)).toBe(
      "intro\n\n![](/images/a-1.jpg)\n\nmiddle"
    );
  });

  it("finds nothing for an image the text does not embed", () => {
    expect(imageRange(doc, "/images/nope.jpg")).toBeNull();
  });
});
