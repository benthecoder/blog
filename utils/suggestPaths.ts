export interface PathEntry {
  path: string;
  title: string;
}

const SUGGEST_THRESHOLD = 0.6;
const MAX_SUGGESTIONS = 3;

// Common wrong-section spellings readers type or old links used.
const SECTION_ALIASES: Record<string, string> = {
  post: "posts",
  blog: "posts",
  essay: "essays",
  writing: "essays",
  wikis: "wiki",
  recipe: "recipes",
  paper: "papers",
  project: "projects",
  tag: "tags",
  thought: "thoughts",
  photo: "photos",
};

export function normalize(input: string): string {
  let s = input;
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep raw on malformed escapes
  }
  return s
    .toLowerCase()
    .replace(/\.(html?|md|php|xml|json|txt)$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/[^\p{L}\p{N} ]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  let score = 1 - levenshtein(a, b) / maxLen;
  // truncated links: "fedex-marin" for "fedex-marin-trip"
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 4 && long.startsWith(short)) {
    score = Math.max(score, 0.85);
  }
  return score;
}

function tokenOverlap(query: string, title: string): number {
  const q = query.split(" ").filter((t) => t.length >= 2);
  const t = title.split(" ").filter((x) => x.length >= 2);
  if (!q.length || !t.length) return 0;
  const hit = q.filter((qt) =>
    t.some(
      (tt) =>
        tt === qt ||
        (qt.length >= 4 && tt.length >= 4 && levenshtein(qt, tt) <= 1)
    )
  ).length;
  return hit / Math.max(q.length, Math.min(t.length, q.length + 1));
}

export function suggestPaths(
  pathname: string,
  entries: PathEntry[],
  threshold = SUGGEST_THRESHOLD,
  limit = MAX_SUGGESTIONS
): PathEntry[] {
  const segments = pathname.split(/[?#]/)[0].split("/").filter(Boolean);
  if (!segments.length) return [];

  const lastRaw = segments[segments.length - 1];
  const query = normalize(lastRaw);
  if (query.length < 3) return [];

  const section = normalize(segments[0]);
  const fixedSection = SECTION_ALIASES[section] ?? section;

  const scored = entries
    .map((entry) => {
      const parts = entry.path.split("/").filter(Boolean);
      const candSlug = normalize(parts[parts.length - 1] ?? "");
      const candSection = parts[0] ?? "";
      let score = Math.max(
        similarity(query, candSlug),
        tokenOverlap(query, normalize(entry.title)) * 0.9
      );
      // /post/xyz -> /posts/xyz style: a matching (or alias-fixed) section
      // is a tiebreaker, and a mismatched one a small penalty.
      if (segments.length > 1 && parts.length > 1) {
        score += candSection === fixedSection ? 0.1 : -0.05;
      }
      return { entry, score };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ entry }) => entry);
}
