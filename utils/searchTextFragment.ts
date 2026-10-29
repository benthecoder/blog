const MAX_WORDS = 8;
const WORDS_BEFORE = 3;

const IMAGE_ONLY = /^!\[[^\]]*\]\([^)]*\)$/;
const FENCE = /^(```|~~~)/;

function toPlainText(line: string): string {
  return line
    .replace(/^\s*(?:>\s*)+/, "")
    .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/, "")
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function encodeDirective(text: string): string {
  return encodeURIComponent(text).replace(/-/g, "%2D");
}

/**
 * Builds a `#:~:text=` URL fragment pointing at the first passage in a search
 * chunk that contains a query keyword, or null when none can be built.
 */
export function textFragment(
  content: string,
  keywords: string[],
  chunkType?: string
): string | null {
  if (chunkType === "code" || keywords.length === 0) return null;

  for (const raw of content.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed || IMAGE_ONLY.test(trimmed) || FENCE.test(trimmed)) continue;

    const words = toPlainText(trimmed).split(" ").filter(Boolean);
    const hit = words.findIndex((word) => {
      const lower = word.toLowerCase();
      return keywords.some((k) => lower.includes(k));
    });
    if (hit === -1) continue;

    const start = Math.max(0, hit - WORDS_BEFORE);
    const passage = words
      .slice(start, start + MAX_WORDS)
      .join(" ")
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const lower = passage.toLowerCase();
    if (!passage || !keywords.some((k) => lower.includes(k))) continue;

    return `#:~:text=${encodeDirective(passage)}`;
  }
  return null;
}
