/**
 * Design-system lint: token and component rules for app/ and components/.
 *
 *   hex, palette, rgb, mode-token  raw colors (also enforced by @shadcn/lint
 *                                  no-raw-colors in `pnpm lint`)
 *   one-off                        arbitrary px/rem values such as p-[13px]
 *   raw-html                       a plain <button> where Button, IconButton,
 *                                  or Chip already exists
 *   limit-per-view                 more than one solid Button in a file
 *
 * Raw colors and one-off values fail the check. Existing leftover <button>s
 * are baselined as warnings so the build stays green; a new one, or a higher
 * count in a baselined file, is an error. Limit-per-view fails, except on
 * the /design specimen page.
 */
export type Level = "error" | "warn";

export type Finding = {
  file: string;
  line: number;
  column: number;
  rule: string;
  match: string;
  hint: string;
  level: Level;
};

export type AllowEntry = {
  file: string;
  match: string;
  reason: string;
};

export type Baseline = {
  "raw-html": Record<string, number>;
};

export const PRIMITIVE_BUTTON_FILES = [
  "components/ui/Button.tsx",
  "components/ui/IconButton.tsx",
  "components/ui/Chip.tsx",
  "components/ui/ThemeSwitch.tsx",
  "components/ui/PaletteSwitch.tsx",
] as const;

/** The specimen page renders every variant on purpose. */
export const SPECIMEN_FILES = ["app/design/page.tsx"] as const;

const PALETTE =
  "red|green|blue|gray|zinc|slate|neutral|stone|amber|yellow|orange|sky|indigo|purple|pink|rose|emerald|teal";
const PREFIX = "text|bg|border|ring|outline|fill|stroke|from|to|via";

const HEX_RE =
  /(?<=["'`(\s[:])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const PALETTE_RE = new RegExp(
  `(?<![\\w-])(?:${PREFIX})-(?:(?:${PALETTE})-\\d{2,3}|black|white)(?![\\w-])`,
  "g"
);
const RGB_RE = /\brgba?\s*\(/g;
const MODE_TOKEN_RE =
  /(?<![:\w-])bg-chalk(?:-[a-z]+)?(?![\w-])|\bdark:(?:text|bg|border|ring|outline|fill|stroke)-ink(?:-[a-z]+)?(?![\w-])/g;
/** A single px/rem number in brackets: p-[13px], h-[22rem], not max-w-[65ch]. */
const ONE_OFF_RE =
  /(?<![\w-])(?:[\w:/.-]+?:)*[\w-]+-\[[+-]?\d*\.?\d+(?:px|rem)\]/g;
const RAW_BUTTON_RE = /<button\b/g;
const BUTTON_OPEN_RE = /<(Button|ButtonLink)(?=[\s>/])/g;
const SOLID_VARIANT_RE = /\bvariant\s*=\s*(?:\{\s*)?["']solid["']/;

const HINTS = {
  hex: "use a role or token from app/globals.css",
  palette: "use a role (accent, danger, line...) or night/NN for an overlay",
  rgb: "use a role or token from app/globals.css instead of raw rgb/rgba",
  "mode-token":
    "pair ink-* in light mode and chalk-* behind dark:, or use a role token",
  "one-off-text": "use text-3xs / text-2xs / text-caption / text-xs",
  "one-off":
    "use a spacing or size token (p-3, gap-4, w-8, h-16, rounded-sm) instead of a one-off [Npx]/[Nrem]",
  "raw-html": "use Button, IconButton, or Chip from components/ui",
  "limit-per-view":
    'more than 1 solid <Button> in this view. Two solid pills compete; use variant="outline" or "quiet" for the rest',
} as const;

function oneOffHint(match: string): string {
  return /(?:^|:)text-\[/.test(match)
    ? HINTS["one-off-text"]
    : HINTS["one-off"];
}

function isCommentLine(line: string): boolean {
  return /^\s*(\/\/|\*|\/\*)/.test(line);
}

function lineColumn(
  source: string,
  index: number
): { line: number; column: number } {
  const upto = source.slice(0, index);
  const line = upto.split("\n").length;
  const column = index - upto.lastIndexOf("\n");
  return { line, column };
}

function lineAt(source: string, index: number): string {
  const start = source.lastIndexOf("\n", index - 1) + 1;
  const end = source.indexOf("\n", index);
  return source.slice(start, end === -1 ? undefined : end);
}

function allowed(allow: AllowEntry[], file: string, match: string): boolean {
  return allow.some((entry) => entry.file === file && entry.match === match);
}

function openingTag(source: string, start: number): string | null {
  let quote: string | null = null;
  let braces = 0;
  for (let i = start + 1; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === "\\") {
        i++;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === "{") {
      braces++;
    } else if (char === "}") {
      braces = Math.max(0, braces - 1);
    } else if (char === ">" && braces === 0) {
      return source.slice(start, i + 1);
    }
  }
  return null;
}

export type LintOptions = {
  allow?: AllowEntry[];
  baseline?: Baseline;
  primitiveFiles?: readonly string[];
  specimenFiles?: readonly string[];
};

export function lintDesign(
  files: { file: string; source: string }[],
  options: LintOptions = {}
): Finding[] {
  const allow = options.allow ?? [];
  const baseline = options.baseline?.["raw-html"] ?? {};
  const primitives = new Set(options.primitiveFiles ?? PRIMITIVE_BUTTON_FILES);
  const specimens = new Set(options.specimenFiles ?? SPECIMEN_FILES);
  const findings: Finding[] = [];
  const rawHtmlByFile = new Map<string, Finding[]>();

  const lineRules: Array<{
    rule: string;
    re: RegExp;
    hint: (match: string) => string;
  }> = [
    { rule: "hex", re: HEX_RE, hint: () => HINTS.hex },
    { rule: "palette", re: PALETTE_RE, hint: () => HINTS.palette },
    { rule: "rgb", re: RGB_RE, hint: () => HINTS.rgb },
    { rule: "mode-token", re: MODE_TOKEN_RE, hint: () => HINTS["mode-token"] },
    { rule: "one-off", re: ONE_OFF_RE, hint: oneOffHint },
  ];

  for (const { file, source } of files) {
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      if (isCommentLine(line)) return;
      for (const rule of lineRules) {
        rule.re.lastIndex = 0;
        for (const match of line.matchAll(rule.re)) {
          if (allowed(allow, file, match[0])) continue;
          findings.push({
            file,
            line: index + 1,
            column: (match.index ?? 0) + 1,
            rule: rule.rule,
            match: match[0],
            hint: rule.hint(match[0]),
            level: "error",
          });
        }
      }
    });

    if (!primitives.has(file)) {
      RAW_BUTTON_RE.lastIndex = 0;
      for (const match of source.matchAll(RAW_BUTTON_RE)) {
        const index = match.index ?? 0;
        if (isCommentLine(lineAt(source, index))) continue;
        const { line, column } = lineColumn(source, index);
        const finding: Finding = {
          file,
          line,
          column,
          rule: "raw-html",
          match: match[0],
          hint: HINTS["raw-html"],
          level: "error",
        };
        const list = rawHtmlByFile.get(file) ?? [];
        list.push(finding);
        rawHtmlByFile.set(file, list);
      }
    }

    if (!specimens.has(file)) {
      const solid: Finding[] = [];
      BUTTON_OPEN_RE.lastIndex = 0;
      for (const match of source.matchAll(BUTTON_OPEN_RE)) {
        const index = match.index ?? 0;
        if (isCommentLine(lineAt(source, index))) continue;
        const tag = openingTag(source, index);
        if (!tag || !SOLID_VARIANT_RE.test(tag)) continue;
        const { line, column } = lineColumn(source, index);
        solid.push({
          file,
          line,
          column,
          rule: "limit-per-view",
          match: tag.trim().slice(0, 80),
          hint: HINTS["limit-per-view"],
          level: "error",
        });
      }
      if (solid.length > 1) findings.push(...solid);
    }
  }

  for (const [file, list] of rawHtmlByFile) {
    const allowedCount = baseline[file] ?? 0;
    const over = list.length > allowedCount;
    for (const finding of list) {
      finding.level = over ? "error" : "warn";
      if (over && allowedCount > 0) {
        finding.hint = `${HINTS["raw-html"]} (baseline allows ${allowedCount}, found ${list.length})`;
      }
      findings.push(finding);
    }
  }

  findings.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      a.rule.localeCompare(b.rule)
  );
  return findings;
}

export function countByRule(
  findings: Finding[],
  level?: Level
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const finding of findings) {
    if (level && finding.level !== level) continue;
    counts[finding.rule] = (counts[finding.rule] ?? 0) + 1;
  }
  return counts;
}
