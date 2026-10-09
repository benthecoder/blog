import { withRetry, wait } from "../retry";
import {
  CLUSTER_LABEL_MODEL,
  CLUSTER_LABEL_MAX_SAMPLES,
  CLUSTER_LABEL_REUSE_MIN_OVERLAP,
  CLUSTER_LABEL_TIMEOUT,
} from "../../config/constants";
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

const MAX_LISTED_TITLES = 40;

/**
 * Construct prompt for cluster labeling. `articles` must be ordered nearest
 * the cluster centroid first, so the head of the list is the most typical.
 */
export function buildClusterPrompt(
  articles: ArticleData[],
  samples: ArticleData[],
  terms: string[] = []
): string {
  const titles = articles
    .slice(0, MAX_LISTED_TITLES)
    .map((a, i) => `${i + 1}. ${a.postTitle}`)
    .join("\n");

  const sampleDetails = samples
    .map((s) => {
      const preview = stripScaffolding(s.content)
        .substring(0, 300)
        .replace(/\s+/g, " ")
        .trim();
      return `"${s.postTitle}"\n  ${preview}...`;
    })
    .join("\n\n");

  return `You are naming a cluster of ${articles.length} semantically similar blog posts. Find the specific idea or subject they share.

Most typical post titles (nearest the cluster centre first):
${titles}

Distinctive terms for this cluster versus the rest of the blog:
${terms.length ? terms.join(", ") : "none"}

Excerpts from the ${samples.length} most typical posts:
${sampleDetails}

Rules:
- ALL LOWERCASE, 1-4 words
- Name the subject or idea the posts are about, never their format or medium
- Concrete and specific beats broad

Good: "ml infrastructure", "chronic pain and doctors", "church and faith", "conversation skills", "climate tech"
Bad: "daily logs", "link roundups", "personal reflections", "blog posts", "miscellaneous"

Reply with ONLY the label, nothing else:`;
}

/**
 * Call OpenRouter (OpenAI-compatible chat API) with retry logic to generate a cluster label
 */
async function callModelForLabel(
  prompt: string,
  model: string
): Promise<string> {
  return withRetry(
    async (signal) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 50,
          // nemotron reasons by default: slow (30s+) and the thinking leaks
          // into the reply instead of the label
          reasoning: { enabled: false },
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        throw Object.assign(
          new Error(`OpenRouter ${res.status}: ${await res.text()}`),
          { status: res.status }
        );
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      let label = data.choices?.[0]?.message?.content?.trim() ?? "";

      // Take only the first line (in case the model adds explanation)
      label = label.split("\n")[0].trim();

      // Clean up markdown formatting the model might add
      label = label
        .replace(/^\*\*(.+)\*\*$/, "$1") // Remove **bold**
        .replace(/^["'](.+)["']$/, "$1") // Remove quotes
        .replace(/^\*(.+)\*$/, "$1") // Remove *italic*
        .toLowerCase() // Force lowercase
        .trim();

      // Validate label (2-60 chars)
      if (!label || label.length < 2 || label.length > 60) {
        throw new Error(
          `Invalid label format: "${label}" (${label.length} chars)`
        );
      }

      return label;
    },
    {
      maxRetries: 3,
      timeout: CLUSTER_LABEL_TIMEOUT,
      shouldRetry: (error: unknown) => {
        const err = error as {
          status?: number;
          message?: string;
          code?: string;
        };
        // Retry on rate limits, timeouts, overloaded errors
        return Boolean(
          err?.code === "ETIMEDOUT" ||
            err?.status === 429 ||
            (err?.status ?? 0) >= 500 ||
            err?.message?.includes("timeout") ||
            err?.message?.includes("overloaded") ||
            err?.message?.includes("Invalid label")
        );
      },
      onRetry: (error: unknown, attempt: number, delay: number) => {
        const err = error as { message?: string };
        console.log(
          `Cluster labeling retry ${attempt}/3: ${err.message}. ` +
            `Waiting ${delay}ms...`
        );
      },
    }
  );
}

/**
 * Generate semantic labels for clusters using an OpenRouter model
 *
 * Clusters that match one from the previous map keep its label; only the rest
 * are sent to the model (and only when OPENROUTER_API_KEY is set).
 *
 * @param clusters - Map of cluster ID to its articles, nearest the centroid first
 * @param options - Configuration options
 * @returns Map of cluster ID to label string
 */
export async function labelClusters(
  clusters: Map<number, ArticleData[]>,
  options: ClusterLabelingOptions = {}
): Promise<Map<number, string>> {
  const {
    maxSamplesPerCluster = CLUSTER_LABEL_MAX_SAMPLES,
    model = CLUSTER_LABEL_MODEL,
    previous = [],
    terms = new Map<number, string[]>(),
  } = options;

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
  const unlabeled = Array.from(clusters.keys())
    .filter((id) => id !== -1 && !labels.has(id))
    .sort((a, b) => a - b);

  console.log(`\nReused ${labels.size} labels from the previous map`);
  if (unlabeled.length === 0) return labels;

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(
      `⚠️  OPENROUTER_API_KEY not set, leaving ${unlabeled.length} clusters unlabeled`
    );
    return labels;
  }

  console.log(`Labeling ${unlabeled.length} clusters with ${model}...`);

  for (const clusterId of unlabeled) {
    const articles = clusters.get(clusterId)!;

    try {
      const samples = articles.slice(0, maxSamplesPerCluster);
      const prompt = buildClusterPrompt(
        articles,
        samples,
        terms.get(clusterId)
      );

      // Call API
      const label = await callModelForLabel(prompt, model);

      labels.set(clusterId, label);
      console.log(
        `  Cluster ${clusterId} (${articles.length} posts): "${label}"`
      );

      // Small delay between requests to avoid rate limits
      await wait(100);
    } catch (error) {
      console.error(`Failed to label cluster ${clusterId}:`, error);
      // Use fallback label
      labels.set(clusterId, `Cluster ${clusterId}`);
    }
  }

  console.log(`✓ Labeled ${labels.size} clusters`);
  return labels;
}
