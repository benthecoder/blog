import { describe, expect, it, vi } from "vitest";
import {
  navAnchorName,
  postPreviewAnchorName,
  supportsCssAnchorPositioning,
} from "./cssAnchor";

describe("supportsCssAnchorPositioning", () => {
  it("is true when CSS.supports accepts anchor-name", () => {
    const supports = vi.fn(
      (property: string, value: string) =>
        property === "anchor-name" && value === "--a"
    );
    expect(supportsCssAnchorPositioning(supports)).toBe(true);
    expect(supports).toHaveBeenCalledWith("anchor-name", "--a");
  });

  it("is false when the property is unknown or supports is missing", () => {
    expect(supportsCssAnchorPositioning(() => false)).toBe(false);
    expect(supportsCssAnchorPositioning(undefined)).toBe(false);
  });
});

describe("navAnchorName", () => {
  it("returns a dashed ident for the icon id", () => {
    expect(navAnchorName("archive")).toBe("--site-nav-archive");
  });
});

describe("postPreviewAnchorName", () => {
  it("returns a dashed ident, stripping characters illegal in CSS idents", () => {
    expect(postPreviewAnchorName(":R1:")).toBe("--post-preview-R1");
  });

  it("falls back when every character is stripped", () => {
    expect(postPreviewAnchorName(":::")).toBe("--post-preview-x");
  });
});
