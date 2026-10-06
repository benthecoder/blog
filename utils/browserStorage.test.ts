import { afterEach, describe, expect, it, vi } from "vitest";
import { readStoredString, writeStoredString } from "./browserStorage";
afterEach(() => vi.unstubAllGlobals());
describe("optional browser storage", () => {
  it("works when browser storage access is blocked", () => {
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new Error("Storage blocked");
      },
    });
    expect(readStoredString("query", "session")).toBeNull();
    expect(writeStoredString("query", "notes", "session")).toBe(false);
  });
});
