import { describe, expect, it } from "vitest";
import { setImageCaption } from "./imageCaption";

describe("setImageCaption", () => {
  it("fills an empty caption", () => {
    expect(
      setImageCaption("a\n\n![](/images/x.jpg)\n", "/images/x.jpg", "our boat")
    ).toBe("a\n\n![our boat](/images/x.jpg)\n");
  });

  it("replaces only the matching image", () => {
    expect(
      setImageCaption(
        "![one](/images/a.jpg)\n\n![two](/images/b.jpg)",
        "/images/b.jpg",
        ""
      )
    ).toBe("![one](/images/a.jpg)\n\n![](/images/b.jpg)");
  });

  it("escapes brackets and survives an escaped old caption", () => {
    const once = setImageCaption("![](/i.jpg)", "/i.jpg", "gator [1]");
    expect(once).toBe("![gator \\[1\\]](/i.jpg)");
    expect(setImageCaption(once, "/i.jpg", "gator $1")).toBe(
      "![gator $1](/i.jpg)"
    );
  });
});
