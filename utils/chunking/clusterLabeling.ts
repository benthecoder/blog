import { z } from "zod";
import { generateStructured, hasLlmKey } from "../llm";
import { CLUSTER_LABEL_REUSE_MIN_OVERLAP } from "../../config/constants";
import { stripScaffolding } from "./postVectors";
import type {
  ArticleData,
  ClusterLabelingOptions,
  PreviousClusterLabel,
} from "../../types/knowledgeMap";

const FALLBACK_LABEL = /^Cluster -?\d+$/;

/**
 * Carry labels over from the previous map. k-means isn't seeded, so cluster
 * IDs reshuffle on every run — match by membership instead: each new cluster
 * takes the label of the previous cluster it shares the most posts with
 * (Jaccard on post slugs), if the overlap clears `minOverlap`. Each previous
 * label is used at most once, best matches first.
 */
export function matchPreviousLabels(
  clusters: Map<number, string[]>,
  previous: PreviousClusterLabel[],
  minOverlap = CLUSTER_LABEL_REUSE_MIN_OVERLAP
): Map<number, string> {
  const candidates: { clusterId: number; prev: number; score: number }[] = [];
  const prevSets = previous.map((p) => new Set(p.slugs));

  for (const [clusterId, slugs] of clusters) {
    if (clusterId === -1) continue;
    prevSets.forEach((prevSet, prev) => {
      if (FALLBACK_LABEL.test(previous[prev].label)) return;
      const shared = slugs.filter((s) => prevSet.has(s)).length;
      const score = shared / (slugs.length + prevSet.size - shared);
      if (score >= minOverlap) candidates.push({ clusterId, prev, score });
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const matched = new Map<number, string>();
  const usedPrev = new Set<number>();
  for (const { clusterId, prev } of candidates) {
    if (matched.has(clusterId) || usedPrev.has(prev)) continue;
    matched.set(clusterId, previous[prev].label);
    usedPrev.add(prev);
  }
  return matched;
}

const SAMPLES_PER_CLUSTER = 5;

export interface LabelInput {
  id: number;
  size: number;
  terms: string[];
  // nearest the cluster centre first
  articles: ArticleData[];
}

function describe(article: ArticleData): string {
  const text =
    article.summary ??
    stripScaffolding(article.content).slice(0, 200).replace(/\s+/g, " ");
  return `- ${article.postTitle}: ${text}`;
}

/**
 * One prompt for every cluster so the model can keep the labels distinct.
 * `taken` are labels already assigned (reused from the previous map).
 */
export function buildLabelPrompt(
  clusters: LabelInput[],
  taken: string[] = []
): string {
  const blocks = clusters
    .map(
      (c) =>
        `## cluster ${c.id} (${c.size} posts)\nDistinctive terms: ${c.terms.join(", ") || "none"}\nMost typical posts:\n${c.articles
          .slice(0, SAMPLES_PER_CLUSTER)
          .map(describe)
          .join("\n")}`
    )
    .join("\n\n");
  return `You are naming clusters of a personal blog's posts. Each cluster groups posts about a similar idea or subject.

${blocks}

${taken.length ? `These labels are already taken, so do not reuse them: ${taken.join("; ")}\n\n` : ""}Rules:
- one label per cluster, ALL LOWERCASE, 1-4 words
- name the subject or idea, never the format ("daily logs", "link roundups", "blog posts", "personal reflections" are bad)
- labels must be clearly different from each other; if two clusters overlap, pick the angle that sets each apart
- concrete and specific beats broad

Return one label per cluster number, covering every cluster.`;
}

export const labelSchema = z.object({
  labels: z.array(z.object({ cluster: z.number(), label: z.string() })),
});

/** Keep valid labels: known id, lowercase, short, and not already used. */
export function validLabels(
  reply: z.infer<typeof labelSchema>,
  ids: number[],
  taken: string[] = []
): Map<number, string> {
  const wanted = new Set(ids);
  const used = new Set(taken);
  const out = new Map<number, string>();
  for (const { cluster, label: raw } of reply.labels) {
    if (!wanted.has(cluster) || out.has(cluster)) continue;
    const label = raw
      .replace(/^["'*]+|["'*]+$/g, "")
      .toLowerCase()
      .trim();
    if (label.length < 2 || label.length > 60 || used.has(label)) continue;
    used.add(label);
    out.set(cluster, label);
  }
  return out;
}

/**
 * Generate labels for clusters with a single OpenRouter request.
 *
 * Clusters that match one from the previous map keep its label. The rest are
 * labeled together (and only when OPENROUTER_API_KEY is set); any the model
 * skips or duplicates get one more round with the survivors marked as taken.
 *
 * @param clusters - Map of cluster ID to its articles, nearest the centroid first
 */
export async function labelClusters(
  clusters: Map<number, ArticleData[]>,
  options: ClusterLabelingOptions = {}
): Promise<Map<number, string>> {
  const { previous = [], terms = new Map<number, string[]>() } = options;

  const labels = matchPreviousLabels(
    new Map(
      Array.from(clusters, ([id, articles]) => [
        id,
        articles.map((a) => a.postSlug),
      ])
    ),
    previous
  );
  // noise (-1) stays unlabeled
  let unlabeled = Array.from(clusters.keys())
    .filter((id) => id !== -1 && !labels.has(id))
    .sort((a, b) => a - b);

  console.log(`\nReused ${labels.size} labels from the previous map`);
  if (unlabeled.length === 0) return labels;

  if (!hasLlmKey()) {
    console.warn(
      `⚠️  GEMINI_API_KEY not set, leaving ${unlabeled.length} clusters unlabeled`
    );
    return labels;
  }

  console.log(`Labeling ${unlabeled.length} clusters in one request...`);
  let requests = 0;
  for (let round = 0; round < 2 && unlabeled.length > 0; round++) {
    const taken = Array.from(labels.values());
    const prompt = buildLabelPrompt(
      unlabeled.map((id) => ({
        id,
        size: clusters.get(id)!.length,
        terms: terms.get(id) ?? [],
        articles: clusters.get(id)!,
      })),
      taken
    );
    try {
      requests++;
      const reply = await generateStructured({ schema: labelSchema, prompt });
      validLabels(reply, unlabeled, taken).forEach((label, id) =>
        labels.set(id, label)
      );
    } catch (error) {
      console.warn(
        `  labeling failed: ${error instanceof Error ? error.message.slice(0, 120) : error}`
      );
    }
    unlabeled = unlabeled.filter((id) => !labels.has(id));
  }
  unlabeled.forEach((id) => labels.set(id, `Cluster ${id}`));
  console.log(`✓ Labeled ${labels.size} clusters (${requests} requests)`);
  return labels;
}
