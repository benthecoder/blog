import matter from "gray-matter";

// Normalizes a draft's markdown to the house style seen in published posts.
// Pure and idempotent: format(format(x)) === format(x).

const FM_ORDER = ["title", "tags", "date"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LABEL_KEYS =
  "mood|wake|sleep|breakfast|lunch|dinner|snack|grateful for|meals|til|links|quote";
const LABEL_RE = new RegExp(`^(\\s*- )?(${LABEL_KEYS})(:+)(\\s*)(.*)$`, "i");
// Labels that open a section, so they get a blank line above them.
const SECTION_RE = /^(meals|til|links|quote):/i;
const QUOTE_LABEL_RE = /^(\s*- )?quote:/i;

const FRONTMATTER_RE = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;

/** 'Mon D, YYYY' from a Date or a date-ish string; null if unparseable. */
function formatDate(value: unknown): string | null {
  let y: number, m: number, d: number;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    // YAML parses bare ISO dates as UTC midnight.
    [y, m, d] = [
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ];
  } else if (typeof value === "string") {
    const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      [y, m, d] = [Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])];
    } else {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) return null;
      [y, m, d] = [parsed.getFullYear(), parsed.getMonth(), parsed.getDate()];
    }
  } else {
    return null;
  }
  return `${MONTHS[m]} ${d}, ${y}`;
}

function formatFrontmatter(raw: string, md: string): string {
  const entries: { key: string; lines: string[] }[] = [];
  const preamble: string[] = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z_][\w-]*):/);
    if (m) entries.push({ key: m[1], lines: [line] });
    else if (entries.length) entries[entries.length - 1].lines.push(line);
    else preamble.push(line);
  }

  const date = formatDate(matter(md).data.date);
  const rank = (key: string) => {
    const i = FM_ORDER.indexOf(key);
    return i === -1 ? FM_ORDER.length : i;
  };
  // Array#sort is stable, so unknown keys keep their original order.
  const sorted = [...entries].sort((a, b) => rank(a.key) - rank(b.key));

  const out = [...preamble];
  for (const e of sorted) {
    if (e.key === "date" && date) out.push(`date: '${date}'`);
    else out.push(...e.lines);
  }
  while (out.length && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n");
}

/** Marks which lines sit inside a fenced code block (fences included). */
function fencedLines(lines: string[]): boolean[] {
  let open = false;
  return lines.map((line) => {
    const isFence = /^\s*(```|~~~)/.test(line);
    if (isFence) {
      const was = open;
      open = !open;
      return was || open;
    }
    return open;
  });
}

function formatBody(body: string): string {
  let lines = body.split("\n");

  // Whitespace-only lines become empty. Non-empty lines keep their trailing
  // spaces: `wake: 0900  ` is a markdown hard break.
  let fenced = fencedLines(lines);
  lines = lines.map((l, i) => (!fenced[i] && l.trim() === "" ? "" : l));

  while (lines.length && lines[0] === "") lines.shift();

  // A leading epigraph moves to the end under a `quote:` label.
  const hasQuote = lines.some((l) => QUOTE_LABEL_RE.test(l));
  if (!hasQuote && lines.length && lines[0].startsWith(">")) {
    let end = 0;
    while (end < lines.length && lines[end].startsWith(">")) end++;
    const epigraph = lines.slice(0, end);
    lines = lines.slice(end);
    while (lines.length && lines[0] === "") lines.shift();
    while (lines.length && lines[lines.length - 1] === "") lines.pop();
    lines.push("", "quote:", "", ...epigraph);
  }

  // Label lines: `key::` / `key:value` / `key:-` -> `key: value`.
  fenced = fencedLines(lines);
  lines = lines.map((line, i) => {
    if (fenced[i]) return line;
    const m = line.match(LABEL_RE);
    if (!m) return line;
    const [, bullet = "", key, , gap, rest] = m;
    if (rest !== "") return `${bullet}${key}: ${rest}`;
    // A bare label keeps only a real hard break (2+ trailing spaces).
    return `${bullet}${key}:${gap.length >= 2 ? gap : ""}`;
  });

  // Collapse 3+ blank lines to one.
  fenced = fencedLines(lines);
  const collapsed: string[] = [];
  let blanks = 0;
  lines.forEach((line, i) => {
    if (line === "" && !fenced[i]) {
      blanks++;
      return;
    }
    if (blanks > 0) collapsed.push(...Array(blanks >= 3 ? 1 : blanks).fill(""));
    blanks = 0;
    collapsed.push(line);
  });
  lines = collapsed;

  // Exactly one blank line before section labels (unless first in the body).
  fenced = fencedLines(lines);
  const spaced: string[] = [];
  lines.forEach((line, i) => {
    if (!fenced[i] && SECTION_RE.test(line) && spaced.length > 0) {
      while (spaced.length && spaced[spaced.length - 1] === "") spaced.pop();
      if (spaced.length > 0) spaced.push("");
    }
    spaced.push(line);
  });
  lines = spaced;

  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

export function formatDraft(markdown: string): string {
  const text = markdown.replace(/\r\n?/g, "\n");
  const m = text.match(FRONTMATTER_RE);

  const body = formatBody(m ? text.slice(m[0].length) : text);
  if (!m) return body ? body + "\n" : "";

  const fm = `---\n${formatFrontmatter(m[1], text)}\n---\n`;
  return body ? `${fm}\n${body}\n` : fm;
}
