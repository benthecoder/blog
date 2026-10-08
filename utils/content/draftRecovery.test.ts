import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  draftRecoveryKey,
  readDraftBackup,
  writeDraftBackup,
  removeDraftBackup,
} from "./draftRecovery";

const backup = {
  markdown: "a sentence worth keeping",
  date: "Oct 6, 2026",
  timestamp: 1234,
};
let entries: Map<string, string>;
beforeEach(() => {
  entries = new Map();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("writing recovery", () => {
  it("keeps new posts on different days independently", () => {
    const first = draftRecoveryKey("new", "2026-10-06");
    const second = draftRecoveryKey("new", "2026-10-07");
    writeDraftBackup(first, backup);
    writeDraftBackup(second, { ...backup, markdown: "tomorrow" });
    removeDraftBackup(second);
    expect(readDraftBackup(first)).toEqual(backup);
    expect(readDraftBackup(second)).toBeNull();
    expect(draftRecoveryKey("noise", null)).toBe("draft-noise");
  });
  it.each([
    "{broken",
    "null",
    "[]",
    JSON.stringify({ ...backup, markdown: 2 }),
    JSON.stringify({ ...backup, timestamp: -1 }),
    JSON.stringify({ ...backup, timestamp: 1e20 }),
  ])("ignores invalid browser data: %s", (raw) => {
    entries.set("draft", raw);
    expect(readDraftBackup("draft")).toBeNull();
    expect(entries.get("draft")).toBe(raw);
  });
  it("survives storage access being denied, including the getter", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("denied");
      },
    });
    expect(readDraftBackup("draft")).toBeNull();
    expect(writeDraftBackup("draft", backup)).toBe(false);
    expect(() => removeDraftBackup("draft")).not.toThrow();
  });
  it("reports quota failures without deleting the existing copy", () => {
    entries.set("draft", JSON.stringify(backup));
    window.localStorage.setItem = () => {
      throw new Error("quota");
    };
    expect(writeDraftBackup("draft", { ...backup, markdown: "newer" })).toBe(
      false
    );
    expect(readDraftBackup("draft")).toEqual(backup);
  });
});
