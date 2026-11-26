import { describe, expect, it } from "vitest";
import {
  decodeEntities,
  extractTitle,
  isBareUrlLabel,
  parsePublicUrl,
  untitledLinkLabel,
} from "./link";

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

describe("extractTitle prefers social titles", () => {
  it("uses og:title over the document title", () => {
    expect(
      extractTitle(
        '<title>Tab label</title><meta property="og:title" content="Open Graph title">'
      )
    ).toBe("Open Graph title");
  });

  it("falls back to twitter:title, then the document title", () => {
    expect(
      extractTitle(
        '<meta name="twitter:title" content="Tweet title"><title>Tab</title>'
      )
    ).toBe("Tweet title");
    expect(extractTitle("<title>Tab</title>")).toBe("Tab");
  });

  it("decodes entities in og:title regardless of attribute order", () => {
    expect(
      extractTitle('<meta content="Tom &amp; Jerry&#39;s" property="og:title">')
    ).toBe("Tom & Jerry's");
  });
});

describe("untitledLinkLabel", () => {
  it("shows hostname and path without the scheme or www", () => {
    expect(
      untitledLinkLabel(
        "https://www.anthropic.com/research/migrating-api-to-rust"
      )
    ).toBe("anthropic.com/research/migrating-api-to-rust");
    expect(untitledLinkLabel("https://example.com/")).toBe("example.com");
  });
});

describe("isBareUrlLabel", () => {
  it("treats the URL, with or without a trailing slash, as a bare label", () => {
    const href = "https://example.com/a";
    expect(isBareUrlLabel(href, href)).toBe(true);
    expect(isBareUrlLabel(href + "/", href)).toBe(true);
    expect(isBareUrlLabel("A careful title", href)).toBe(false);
  });
});
