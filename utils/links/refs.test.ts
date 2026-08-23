import { describe, it, expect } from "vitest";
import { refKey, refsEqual, hrefFor } from "./refs";

describe("refKey", () => {
  it("namespaces slug by kind", () => {
    expect(refKey({ kind: "wiki", slug: "kalman-filter" })).toBe(
      "wiki:kalman-filter"
    );
    expect(refKey({ kind: "post", slug: "070226" })).toBe("post:070226");
  });

  it("distinguishes same slug across kinds", () => {
    expect(refKey({ kind: "wiki", slug: "x" })).not.toBe(
      refKey({ kind: "post", slug: "x" })
    );
  });
});

describe("refsEqual", () => {
  it("matches on kind and slug", () => {
    expect(
      refsEqual({ kind: "wiki", slug: "a" }, { kind: "wiki", slug: "a" })
    ).toBe(true);
  });
  it("differs when kind or slug differ", () => {
    expect(
      refsEqual({ kind: "wiki", slug: "a" }, { kind: "post", slug: "a" })
    ).toBe(false);
    expect(
      refsEqual({ kind: "wiki", slug: "a" }, { kind: "wiki", slug: "b" })
    ).toBe(false);
  });
});

describe("hrefFor", () => {
  it("routes by kind", () => {
    expect(hrefFor({ kind: "wiki", slug: "kalman-filter" })).toBe(
      "/wiki/kalman-filter"
    );
    expect(hrefFor({ kind: "post", slug: "070226" })).toBe("/posts/070226");
  });
});
