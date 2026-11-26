/**
 * Design drift check. Fails (exit 1, file:line) when a component reaches
 * around the design system. See `scripts/lib/designLint.ts` for the rules.
 *
 * If a hit is genuinely intentional, add it to ALLOW below with the reason.
 * Leftover <button> counts live in scripts/design-lint-baseline.json: shrink
 * the number when you migrate a file, never raise it.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  countByRule,
  lintDesign,
  type AllowEntry,
  type Baseline,
  type Finding,
} from "./lib/designLint";

/**
 * Intentional exceptions. `match` is the exact text the rule found.
 * An entry covers every occurrence in that file, so keep these narrow.
 */
const ALLOW: AllowEntry[] = [
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
  {
    file: "components/visualizations/Heatmap.tsx",
    match: "h-[12px]",
    reason: "row height of the 12px cell grid on small screens",
  },
  {
    file: "components/visualizations/Heatmap.tsx",
    match: "md:h-[14px]",
    reason: "row height of the 14px cell grid from md and up",
  },
  {
    file: "components/visualizations/Heatmap.tsx",
    match: "w-[9px]",
    reason: "weekday gutter sized to a single character on the 12px cell grid",
  },
  {
    file: "components/ui/Loader.tsx",
    match: "w-[6px]",
    reason: "typing-dot sizes; smaller than the 4px spacing scale steps",
  },
  {
    file: "components/ui/Loader.tsx",
    match: "h-[6px]",
    reason: "typing-dot sizes; smaller than the 4px spacing scale steps",
  },
  {
    file: "components/ui/Loader.tsx",
    match: "w-[7px]",
    reason: "typing-dot sizes; smaller than the 4px spacing scale steps",
  },
  {
    file: "components/ui/Loader.tsx",
    match: "h-[7px]",
    reason: "typing-dot sizes; smaller than the 4px spacing scale steps",
  },
  {
    file: "components/ui/Loader.tsx",
    match: "w-[8px]",
    reason: "typing-dot sizes; smaller than the 4px spacing scale steps",
  },
  {
    file: "components/ui/Loader.tsx",
    match: "h-[8px]",
    reason: "typing-dot sizes; smaller than the 4px spacing scale steps",
  },
  {
    file: "components/ui/Loader.tsx",
    match: "rounded-[1px]",
    reason: "almost-square dots; rounded-xs is larger than this mark",
  },
  {
    file: "components/visualizations/Timeline.tsx",
    match: "min-w-[60px]",
    reason: "year column sized to the date labels on a small screen",
  },
  {
    file: "components/visualizations/Timeline.tsx",
    match: "sm:min-w-[70px]",
    reason: "year column sized to the date labels from sm and up",
  },
  {
    file: "components/visualizations/Timeline.tsx",
    match: "min-w-[80px]",
    reason: "event date column sized to the date labels on a small screen",
  },
  {
    file: "components/visualizations/Timeline.tsx",
    match: "sm:min-w-[90px]",
    reason: "event date column sized to the date labels from sm and up",
  },
  {
    file: "app/admin/edit/[slug]/Editor.tsx",
    match: "max-w-[620px]",
    reason:
      "narrow editor preview width, a named preset rather than a scale step",
  },
  {
    file: "app/admin/edit/[slug]/Editor.tsx",
    match: "max-w-[760px]",
    reason:
      "default editor preview width, a named preset rather than a scale step",
  },
  {
    file: "app/admin/edit/[slug]/Editor.tsx",
    match: "max-w-[960px]",
    reason:
      "wide editor preview width, a named preset rather than a scale step",
  },
  {
    file: "app/admin/edit/[slug]/DefineBubble.tsx",
    match: "w-[36rem]",
    reason: "two-column definition + thesaurus popover; wider than the scale",
  },
  {
    file: "app/(sidebar)/connections/page.tsx",
    match: "min-h-[27rem]",
    reason: "reserved height for the knowledge map canvas on a small screen",
  },
  {
    file: "app/(sidebar)/connections/page.tsx",
    match: "sm:min-h-[33rem]",
    reason: "reserved height for the knowledge map canvas from sm and up",
  },
  {
    file: "components/visualizations/KnowledgeMap.tsx",
    match: "h-[22rem]",
    reason: "map canvas height on a small screen; not a spacing-scale token",
  },
  {
    file: "components/visualizations/KnowledgeMap.tsx",
    match: "sm:h-[28rem]",
    reason: "map canvas height from sm and up; not a spacing-scale token",
  },
];

const ROOTS = ["app", "components"];

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      walk(full, out);
    } else if (
      (full.endsWith(".tsx") || full.endsWith(".ts")) &&
      !full.endsWith(".test.tsx") &&
      !full.endsWith(".test.ts")
    ) {
      out.push(full);
    }
  }
  return out;
}

function formatFinding(finding: Finding): string {
  const tag = finding.level === "warn" ? "warning " : "";
  return `${finding.file}:${finding.line}:${finding.column} ${tag}${finding.rule} ${finding.match} (${finding.hint})`;
}

const baseline = JSON.parse(
  readFileSync(path.join("scripts", "design-lint-baseline.json"), "utf8")
) as Baseline;

const files = ROOTS.flatMap((root) => walk(root))
  .sort()
  .map((file) => ({
    file: file.split(path.sep).join("/"),
    source: readFileSync(file, "utf8"),
  }));

const findings = lintDesign(files, { allow: ALLOW, baseline });
const errors = findings.filter((finding) => finding.level === "error");
const warnings = findings.filter((finding) => finding.level === "warn");

for (const finding of errors) {
  console.log(formatFinding(finding));
}

const errorCounts = countByRule(errors, "error");
const warnCounts = countByRule(warnings, "warn");
const parts = Object.entries(errorCounts).map(([rule, n]) => `${n} ${rule}`);
if (errors.length > 0) {
  console.error(
    `\n${errors.length} design drift ${errors.length === 1 ? "error" : "errors"}${
      parts.length ? ` (${parts.join(", ")})` : ""
    }`
  );
}
if (warnings.length > 0) {
  const warnParts = Object.entries(warnCounts)
    .map(([rule, n]) => `${n} ${rule}`)
    .join(", ");
  const byFile = new Map<string, number>();
  for (const finding of warnings) {
    byFile.set(finding.file, (byFile.get(finding.file) ?? 0) + 1);
  }
  const top = [...byFile.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  console.log(
    `${warnings.length} baselined ${
      warnings.length === 1 ? "warning" : "warnings"
    }${warnParts ? ` (${warnParts})` : ""} in ${top.length} ${
      top.length === 1 ? "file" : "files"
    }; shrink scripts/design-lint-baseline.json when you migrate one`
  );
  for (const [file, count] of top) {
    console.log(`  ${String(count).padStart(3)}  ${file}`);
  }
}
if (errors.length > 0) process.exit(1);
if (warnings.length === 0) console.log("design lint: no drift");
