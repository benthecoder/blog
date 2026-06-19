import { getAnthropicClient } from "../clients";
import { withRetry, wait } from "../retry";
import {
  ANTHROPIC_CLUSTER_MODEL,
  CLUSTER_LABEL_MAX_SAMPLES,
  CLUSTER_LABEL_TIMEOUT,
} from "../../config/constants";
import type {
  ArticleData,
  ClusterLabelingOptions,
} from "../../types/knowledgeMap";

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
 * Call Anthropic API with retry logic to generate a cluster label
 */
async function callAnthropicForLabel(
  prompt: string,
  model: string
): Promise<string> {
  return withRetry(
    async () => {
      const client = getAnthropicClient();

      const message = await client.messages.create({
        model,
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Extract text from response
      let label =
        message.content[0].type === "text"
          ? message.content[0].text.trim()
          : "";

      // Take only the first line (in case Claude adds explanation)
      label = label.split("\n")[0].trim();

      // Clean up markdown formatting that Claude might add
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
      shouldRetry: (error: any) => {
        // Retry on rate limits, timeouts, overloaded errors
        return (
          error?.status === 429 ||
          error?.status === 529 ||
          error?.message?.includes("timeout") ||
          error?.message?.includes("overloaded")
        );
      },
      onRetry: (error: any, attempt: number, delay: number) => {
        console.log(
          `Cluster labeling retry ${attempt}/3: ${error.message}. ` +
            `Waiting ${delay}ms...`
        );
      },
    }
  );
}

/**
 * Generate semantic labels for clusters using Anthropic API
 *
 * @param clusters - Map of cluster ID to array of articles in that cluster
 * @param options - Configuration options
 * @returns Map of cluster ID to label string, or null if labeling failed
 */
export async function labelClusters(
  clusters: Map<number, ArticleData[]>,
  options: ClusterLabelingOptions = {}
): Promise<Map<number, string> | null> {
  const {
    maxSamplesPerCluster = CLUSTER_LABEL_MAX_SAMPLES,
    model = ANTHROPIC_CLUSTER_MODEL,
  } = options;

  console.log(`\nLabeling ${clusters.size} clusters with Claude...`);

  const labels = new Map<number, string>();
  const clusterIds = Array.from(clusters.keys()).sort((a, b) => a - b);

  for (const clusterId of clusterIds) {
    const articles = clusters.get(clusterId)!;

    // Skip noise cluster (-1)
    if (clusterId === -1) {
      labels.set(clusterId, "Uncategorized");
      continue;
    }

    try {
      // Sample articles
      const samples = selectClusterSamples(articles, maxSamplesPerCluster);

      // Build prompt
      const prompt = buildClusterPrompt(articles, samples);

      // Call API
      const label = await callAnthropicForLabel(prompt, model);

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
