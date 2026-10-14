import { describe, expect, it } from "vitest";
import { publishImagePaths, unpublishImagePaths } from "./draftImages";

describe("draft image paths", () => {
  it("moves draft images to the live path on publish", () => {
    expect(publishImagePaths("![](/images/drafts/010125-a.jpg)")).toBe(
      "![](/images/010125-a.jpg)"
    );
  });

  it("moves only the slug's images back to drafts on unpublish", () => {
    const md = "![](/images/010125-a.jpg) ![](/images/020125-b.jpg)";
    expect(unpublishImagePaths(md, "010125")).toBe(
      "![](/images/drafts/010125-a.jpg) ![](/images/020125-b.jpg)"
    );
  });

  it("round-trips", () => {
    const md = "![](/images/drafts/010125-a.jpg)";
    expect(unpublishImagePaths(publishImagePaths(md), "010125")).toBe(md);
  });
});
