import fs from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  new URL("../app/providers.tsx", import.meta.url),
  "utf8"
);
const script = source.match(/const INIT_SCRIPT = `([^`]*)`;/)![1];
const palettes = JSON.parse(
  source
    .match(/export const PALETTES = (\[[\s\S]*?\]) as const/)![1]
    .replace(/,\s*\]/, "]")
) as string[];
const fallback = source.match(/const DEFAULT_PALETTE: Palette = "([^"]+)"/)![1];

function init(stored: string | null, blocked = false) {
  const attributes: Record<string, string> = {};
  vm.runInNewContext(script, {
    localStorage: {
      getItem: () => {
        if (blocked) throw new Error("Storage unavailable");
        return stored;
      },
    },
    document: {
      documentElement: {
        setAttribute: (key: string, value: string) => {
          attributes[key] = value;
        },
      },
    },
  });
  return attributes["data-palette"];
}

describe("palette initialization before hydration", () => {
  it.each(palettes)("restores the %s palette", (palette) => {
    expect(init(palette)).toBe(palette);
  });
  it.each([
    null,
    "unknown",
    '";throw new Error("injected");//',
    "</script><script>alert(1)</script>",
  ])("uses the default for invalid stored data: %s", (stored) =>
    expect(init(stored)).toBe(fallback)
  );
  it("tolerates unavailable storage", () => {
    expect(init(null, true)).toBeUndefined();
  });
});
