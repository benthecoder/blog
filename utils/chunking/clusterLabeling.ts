import { withRetry, wait } from "../retry";
import {
  CLUSTER_LABEL_MODEL,
  CLUSTER_LABEL_MAX_SAMPLES,
  CLUSTER_LABEL_REUSE_MIN_OVERLAP,
  CLUSTER_LABEL_TIMEOUT,
} from "../../config/constants";
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

/**
 * Pick evenly-spaced samples across the cluster's time range.
 * Temporal diversity gives the model a representative view of how the cluster
 * evolved, which produces more accurate labels than random or length-based sampling.
 */
function selectClusterSamples(
  articles: ArticleData[],
  maxSamples: number
): ArticleData[] {
  if (articles.length <= maxSamples) return articles;

  const sorted = [...articles].sort((a, b) => {
    const da = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const db = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    return da - db;
  });

  const step = sorted.length / maxSamples;
  return Array.from(
    { length: maxSamples },
    (_, i) => sorted[Math.floor(i * step)]
  );
}

/**
 * Construct prompt for cluster labeling.
 * Passes all titles for pattern recognition + content excerpts from samples for depth.
 */
function buildClusterPrompt(
  allArticles: ArticleData[],
  samples: ArticleData[]
): string {
  const allTitles = allArticles
    .map((a, i) => `${i + 1}. ${a.postTitle}`)
    .join("\n");

  const sampleDetails = samples
    .map((s) => {
      const preview = s.content.substring(0, 300).replace(/\s+/g, " ").trim();
      const tags = s.tags?.length ? s.tags.join(", ") : "none";
      return `"${s.postTitle}" [tags: ${tags}]\n  ${preview}...`;
    })
    .join("\n\n");

  return `You are labeling a cluster of semantically similar blog posts. Your goal is to find the MOST SPECIFIC shared theme — not the most general one.

ALL ${allArticles.length} post titles in this cluster:
${allTitles}

Detailed excerpts from ${samples.length} representative posts:
${sampleDetails}

What single topic, activity, or subject appears most consistently across these titles? Be as specific as the titles allow.

Rules:
- ALL LOWERCASE, 2-4 words
- Name the SPECIFIC topic (not the emotional register or writing style)
- Prefer concrete nouns over abstract concepts

Good: "machine learning", "book reviews", "sf apartment life", "startup interviews", "travel journals"
Bad: "personal reflections", "exploring ideas", "learning journeys", "moments of growth"

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
            err?.message?.includes("overloaded")
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
 * @param clusters - Map of cluster ID to array of articles in that cluster
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
  if (clusters.has(-1)) labels.set(-1, "Uncategorized");

  const unlabeled = Array.from(clusters.keys())
    .filter((id) => !labels.has(id))
    .sort((a, b) => a - b);

  console.log(
    `\nReused ${clusters.size - unlabeled.length}/${clusters.size} cluster labels from the previous map`
  );
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
      // Sample articles
      const samples = selectClusterSamples(articles, maxSamplesPerCluster);

      // Build prompt
      const prompt = buildClusterPrompt(articles, samples);

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
