import { describe, expect, it } from "vitest";
import { htmlText } from "./htmlText";

describe("htmlText", () => {
  it("decodes entities and ignores attributes when measuring card text", () => {
    expect(htmlText('<div title="1 > 0">A &amp; B &#x1f512;</div>')).toBe(
      "A & B 🔒"
    );
  });

  it("removes executable content and adjacent event attributes", () => {
    expect(
      htmlText(
        '<details open onload="1" ontoggle="alert(1)">word</details><script>alert(2)</script>'
      )
    ).toBe("word");
  });

  it("keeps encoded markup as literal text without parsing it twice", () => {
    expect(htmlText("&lt;script&gt;word&lt;/script&gt;")).toBe(
      "<script>word</script>"
    );
  });
});
