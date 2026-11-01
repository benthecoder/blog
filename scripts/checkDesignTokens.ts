/**
 * Design drift check. Fails (exit 1, file:line) when a component reaches
 * around the design system:
 *
 *   hex     a hex color in a string (colors live in app/globals.css)
 *   palette a Tailwind default palette class (red-500, gray-200, black, white)
 *   size    an arbitrary font size, text-[10px] / text-[0.6875rem]
 *
 * Use a role (text-accent, border-line, bg-danger) or a size token
 * (text-3xs, text-2xs, text-caption) instead. If a hit is genuinely
 * intentional, add it to ALLOW below with the reason.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type Rule = { name: string; re: RegExp; hint: string };

const PALETTE =
  "red|green|blue|gray|zinc|slate|neutral|stone|amber|yellow|orange|sky|indigo|purple|pink|rose|emerald|teal";
const PREFIX = "text|bg|border|ring|outline|fill|stroke|from|to|via";

const RULES: Rule[] = [
  {
    name: "hex",
    // quoted or css-ish context, so `href="#top"` style anchors are skipped
    re: /(?<=["'`(\s[:])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g,
    hint: "use a role or token from app/globals.css",
  },
  {
    name: "palette",
    re: new RegExp(
      `(?<![\\w-])(?:${PREFIX})-(?:(?:${PALETTE})-\\d{2,3}|black|white)(?![\\w-])`,
      "g"
    ),
    hint: "use a role (accent, danger, line...) or night/NN for an overlay",
  },
  {
    name: "size",
    re: /(?<![\w-])text-\[\d*\.?\d+(?:px|rem)\]/g,
    hint: "use text-3xs / text-2xs / text-caption / text-xs",
  },
];

/**
 * Intentional exceptions. `match` is the exact text the rule found.
 * An entry covers every occurrence in that file, so keep these narrow.
 */
const ALLOW: Array<{ file: string; match: string; reason: string }> = [
  {
    file: "app/(sidebar)/colophon/page.tsx",
    match: "#4d5f9e",
    reason:
      "colophon palette swatches: a second copy of the PALETTES block in globals.css, until the page reads computed css vars (plan step 5)",
  },
  {
    file: "app/(sidebar)/colophon/page.tsx",
    match: "#47502f",
    reason:
      "colophon palette swatches: a second copy of the PALETTES block in globals.css, until the page reads computed css vars (plan step 5)",
  },
  {
    file: "app/(sidebar)/colophon/page.tsx",
    match: "#896818",
    reason:
      "colophon palette swatches: a second copy of the PALETTES block in globals.css, until the page reads computed css vars (plan step 5)",
  },
  {
    file: "app/(sidebar)/colophon/page.tsx",
    match: "#3f6d99",
    reason:
      "colophon palette swatches: a second copy of the PALETTES block in globals.css, until the page reads computed css vars (plan step 5)",
  },
  {
    file: "app/(sidebar)/colophon/page.tsx",
    match: "#ab4322",
    reason:
      "colophon palette swatches: a second copy of the PALETTES block in globals.css, until the page reads computed css vars (plan step 5)",
  },
  {
    file: "app/(sidebar)/colophon/page.tsx",
    match: "#93495c",
    reason:
      "colophon palette swatches: a second copy of the PALETTES block in globals.css, until the page reads computed css vars (plan step 5)",
  },
  {
    file: "app/(sidebar)/now/SpotifyNowPlaying.tsx",
    match: "text-[13px]",
    reason:
      "between text-xs (12px) and text-sm (14px); the now-playing line is tuned to sit with the album art",
  },
  {
    file: "components/visualizations/Heatmap.tsx",
    match: "text-[8px]",
    reason:
      "month and weekday labels on a 12px cell grid; smaller than the 9px text-3xs floor on purpose",
  },
];

const ROOTS = ["app", "components"];

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walk(full, out);
    } else if (full.endsWith(".tsx") && !full.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

const allowed = (file: string, match: string) =>
  ALLOW.some((a) => a.file === file && a.match === match);

let failures = 0;
for (const file of ROOTS.flatMap((root) => walk(root)).sort()) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const rule of RULES) {
        for (const m of line.matchAll(rule.re)) {
          if (allowed(file, m[0])) continue;
          failures++;
          console.log(
            `${file}:${i + 1}:${(m.index ?? 0) + 1} ${rule.name} ${m[0]} (${rule.hint})`
          );
        }
      }
    });
}

if (failures > 0) {
  console.error(
    `\n${failures} design drift ${failures === 1 ? "hit" : "hits"}`
  );
  process.exit(1);
}
console.log("design tokens: no drift");
