import { hashText, loadCache, saveCache } from "./postSummaries";
import { l2Normalize } from "./postVectors";

export const LOCAL_EMBED_MODEL = "Xenova/bge-small-en-v1.5";

type VectorCache = Record<string, number[]>;

export interface Embedder {
  name: string;
  embed: (texts: string[]) => Promise<number[][]>;
}

/** Small local model (no API key, runs on CPU). */
export const localEmbedder: Embedder = {
  name: LOCAL_EMBED_MODEL,
  async embed(texts) {
    const { pipeline } = await import("@huggingface/transformers");
    const extractor = await pipeline("feature-extraction", LOCAL_EMBED_MODEL, {
      dtype: "q8",
    });
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 32) {
      const slice = texts.slice(i, i + 32);
      const res = await extractor(slice, { pooling: "mean", normalize: true });
      const dim = res.dims[1];
      slice.forEach((_, j) =>
        out.push(
          Array.from(res.data.slice(j * dim, (j + 1) * dim) as Float32Array)
        )
      );
    }
    return out;
  },
};

/**
 * Embed texts with the given provider, caching vectors by text hash so only
 * new or changed summaries are embedded.
 */
export async function embedTexts(
  texts: string[],
  cacheFile: string,
  embedder: Embedder
): Promise<{ vectors: number[][]; embedded: number }> {
  const cache = loadCache<VectorCache>(cacheFile, {});
  const keys = texts.map((t) => `${embedder.name}:${hashText(t)}`);
  const textByKey = new Map(keys.map((k, i) => [k, texts[i]]));
  const todo = Array.from(new Set(keys.filter((k) => !cache[k])));

  if (todo.length > 0) {
    const vectors = await embedder.embed(todo.map((k) => textByKey.get(k)!));
    todo.forEach((k, i) => {
      cache[k] = vectors[i].map((v) => Math.round(v * 1e5) / 1e5);
    });
    saveCache(cacheFile, cache);
  }
  return { vectors: keys.map((k) => cache[k]), embedded: todo.length };
}

/**
 * Give posts without an embedding the average of their nearest embedded
 * neighbours, found in a second space that covers every post (the full-post
 * vectors). `vectors[i]` is null where missing.
 */
export function imputeMissing(
  vectors: (number[] | null)[],
  neighborSpace: number[][],
  k = 5
): number[][] {
  const known = vectors.flatMap((v, i) => (v ? [i] : []));
  if (known.length === 0) throw new Error("no embedded posts to impute from");
  const dot = (a: number[], b: number[]) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  };
  return vectors.map((v, i) => {
    if (v) return v;
    const nearest = known
      .map((j) => ({ j, sim: dot(neighborSpace[i], neighborSpace[j]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, k);
    const dim = vectors[nearest[0].j]!.length;
    const sum = Array.from({ length: dim }, () => 0);
    for (const { j } of nearest) {
      const nv = vectors[j]!;
      for (let d = 0; d < dim; d++) sum[d] += nv[d];
    }
    return l2Normalize(sum);
  });
}
