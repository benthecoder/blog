import { describe, expect, it } from "vitest";
import { decodeEntities, extractTitle, parsePublicUrl } from "./link";

describe("parsePublicUrl", () => {
  it("accepts ordinary http(s) urls", () => {
    expect(parsePublicUrl("https://example.com/a?b=1")).toBe(
      "https://example.com/a?b=1"
    );
  });

  it.each([
    "javascript:alert(1)",
    "file:///etc/passwd",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://169.254.169.254/latest",
    "http://[::1]/",
    "http://2130706433/",
    "http://printer.local/",
    "http://intranet/",
    "https://user:pw@example.com",
    "not a url",
  ])("rejects %s", (u) => {
    expect(parsePublicUrl(u)).toBeNull();
  });
});

describe("extractTitle", () => {
  it("decodes entities and collapses whitespace", () => {
    expect(
      extractTitle("<title>\n Tom &amp; Jerry&#39;s &#x41; </title>")
    ).toBe("Tom & Jerry's A");
  });

  it("returns null when empty or missing", () => {
    expect(extractTitle("<p>hi</p>")).toBeNull();
    expect(extractTitle("<title>  </title>")).toBeNull();
  });
});

describe("decodeEntities", () => {
  it("leaves unknown entities alone", () => {
    expect(decodeEntities("&bogus; &amp;")).toBe("&bogus; &");
  });
});
