import { describe, expect, it } from "vitest";
import { postImages } from "./postImages";

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
});
