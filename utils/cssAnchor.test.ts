import { describe, expect, it, vi } from "vitest";
import { navAnchorName, supportsCssAnchorPositioning } from "./cssAnchor";

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
