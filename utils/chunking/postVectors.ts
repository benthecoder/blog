export interface VectorChunk {
  postSlug: string;
  chunkType: string;
  content: string;
  embedding: number[];
}

export interface PostVector {
  postSlug: string;
  vector: number[];
  // chunk types averaged into the vector
  source: "section" | "full-post";
}

// Lines from the daily-log template (and markup noise) that say nothing
// about the ideas in a post.
const SCAFFOLD_LINE =
  /^(?:-{3,}|mood:.*|(?:wake|sleep|slept):.*|meals:?|[-*]\s*(?:breakfast|lunch|dinner|snacks?|brunch):.*|grateful for:.*|til:?|links:?|notes:?|reflection:?|!\[.*\]\(.*\)|[-*]?\s*)$/i;

export const MIN_CONTENT_CHARS = 120;
export const MAX_SCAFFOLD_RATIO = 0.6;

export function stripScaffolding(text: string): string {
  return text
    .split("\n")
    .filter((line) => !SCAFFOLD_LINE.test(line.trim()))
    .join("\n")
    .trim();
}

// Share of non-empty text that is template scaffolding
export function scaffoldRatio(text: string): number {
  const total = text.replace(/\s+/g, "").length;
  if (total === 0) return 1;
  const kept = stripScaffolding(text).replace(/\s+/g, "").length;
  return 1 - kept / total;
}

export function isContentChunk(chunk: {
  chunkType: string;
  content: string;
}): boolean {
  if (chunk.chunkType !== "section" && chunk.chunkType !== "full-post") {
    return false;
  }
  return (
    stripScaffolding(chunk.content).length >= MIN_CONTENT_CHARS &&
    scaffoldRatio(chunk.content) <= MAX_SCAFFOLD_RATIO
  );
}

function mean(vectors: number[][]): number[] {
  const out = Array.from({ length: vectors[0].length }, () => 0);
  for (const v of vectors) for (let i = 0; i < v.length; i++) out[i] += v[i];
  return out.map((x) => x / vectors.length);
}

/**
 * One vector per post: the average of its content-bearing section chunks,
 * else its full-post chunk. Posts with no usable chunk fall back to
 * whatever full-post embedding exists so every post still gets a point.
 */
export function buildPostVectors(chunks: VectorChunk[]): PostVector[] {
  const bySlug = new Map<string, VectorChunk[]>();
  for (const chunk of chunks) {
    if (chunk.embedding.length === 0) continue;
    const list = bySlug.get(chunk.postSlug);
    if (list) list.push(chunk);
    else bySlug.set(chunk.postSlug, [chunk]);
  }

  const out: PostVector[] = [];
  for (const [postSlug, list] of bySlug) {
    const sections = list.filter(
      (c) => c.chunkType === "section" && isContentChunk(c)
    );
    if (sections.length > 0) {
      out.push({
        postSlug,
        vector: mean(sections.map((c) => c.embedding)),
        source: "section",
      });
      continue;
    }
    const full = list.find((c) => c.chunkType === "full-post");
    if (full) {
      out.push({ postSlug, vector: full.embedding, source: "full-post" });
    }
  }
  return out;
}

export function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return norm === 0 ? vector.slice() : vector.map((v) => v / norm);
}

/**
 * Subtract the corpus mean, then unit-normalize. Embeddings share a large
 * common direction; removing it leaves what actually differs between posts.
 */
export function centerAndNormalize(vectors: number[][]): number[][] {
  if (vectors.length === 0) return [];
  const mu = mean(vectors);
  return vectors.map((v) => l2Normalize(v.map((x, i) => x - mu[i])));
}

/**
 * Project out a direction (e.g. the "this is a daily log" axis) from every
 * vector, then re-normalize.
 */
export function removeDirection(
  vectors: number[][],
  direction: number[]
): number[][] {
  const d = l2Normalize(direction);
  return vectors.map((v) => {
    const dot = v.reduce((s, x, i) => s + x * d[i], 0);
    return l2Normalize(v.map((x, i) => x - dot * d[i]));
  });
}

/**
 * Direction separating `group` from the rest: difference of the group mean
 * and the remainder mean. Returns null when either side is empty.
 */
export function groupDirection(
  vectors: number[][],
  inGroup: boolean[]
): number[] | null {
  const a = vectors.filter((_, i) => inGroup[i]);
  const b = vectors.filter((_, i) => !inGroup[i]);
  if (a.length === 0 || b.length === 0) return null;
  const ma = mean(a);
  const mb = mean(b);
  return ma.map((x, i) => x - mb[i]);
}
