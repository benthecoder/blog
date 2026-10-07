import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./jsonLd";

describe("JSON-LD embedded in HTML", () => {
  it("cannot close its script element with a malicious title", () => {
    const data = {
      headline: '</script><script>alert("title")</script>',
      author: "Benedict Neo",
    };
    const serialized = serializeJsonLd(data);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(data);
  });
});
