import { getAnthropicClient } from "./clients";
import { withRetry } from "./retry";
import {
  ANTHROPIC_CLUSTER_MODEL,
  CLUSTER_LABEL_MAX_SAMPLES,
  CLUSTER_LABEL_MIN_SAMPLES,
  CLUSTER_LABEL_TIMEOUT,
} from "../config/constants";
import type {
  ArticleData,
  ClusterLabelingOptions,
} from "../types/knowledgeMap";

/**
 * Compute diversity score for sampling strategy
 * Uses tag diversity and temporal spread to ensure representative samples
 */
function computeDiversityMetrics(articles: ArticleData[]) {
  // Extract unique tags
  const allTags = new Set<string>();
  const dates: number[] = [];

  articles.forEach((a) => {
    a.tags?.forEach((tag) => allTags.add(tag));
    if (a.publishedDate) {
      dates.push(new Date(a.publishedDate).getTime());
    }
  });

  return {
    uniqueTags: allTags,
    dateRange: dates.length > 0 ? Math.max(...dates) - Math.min(...dates) : 0,
    tagCount: allTags.size,
  };
}

/**
 * Select representative samples using advanced diversity sampling
 *
 * Strategy for better diversity:
 * 1. Random sampling from different time periods (temporal diversity)
 * 2. Tag-based diversity (select posts with different tags)
 * 3. Content length diversity (mix of short/medium/long posts)
 * 4. Avoid bias from sorting by single dimension
 */
function selectClusterSamples(
  articles: ArticleData[],
  minSamples: number,
  maxSamples: number
): ArticleData[] {
  if (articles.length === 0) return [];

  // Determine sample size
  let sampleSize: number;
  if (articles.length <= 2) {
    sampleSize = articles.length;
  } else if (articles.length <= 5) {
    sampleSize = Math.min(Math.max(2, minSamples), articles.length);
  } else if (articles.length <= 10) {
    sampleSize = Math.min(Math.max(3, minSamples), articles.length);
  } else {
    sampleSize = Math.min(maxSamples, articles.length);
  }

  if (sampleSize >= articles.length) {
    return articles;
  }

  // Compute diversity metrics
  const { uniqueTags } = computeDiversityMetrics(articles);

  // Strategy: Multi-dimensional diverse sampling
  const samples: ArticleData[] = [];
  const remaining = [...articles];
  const usedTags = new Set<string>();

  // 1. First, try to get posts with unique tags for tag diversity
  if (uniqueTags.size > 0) {
    for (const tag of uniqueTags) {
      if (samples.length >= sampleSize) break;

      const postWithTag = remaining.find(
        (a) => a.tags?.includes(tag) && !samples.includes(a)
      );

      if (postWithTag) {
        samples.push(postWithTag);
        postWithTag.tags?.forEach((t) => usedTags.add(t));
        remaining.splice(remaining.indexOf(postWithTag), 1);
      }
    }
  }

  // 2. If we still need more samples, use stratified random sampling
  // Divide by content length and sample from each stratum
  if (samples.length < sampleSize && remaining.length > 0) {
    // Sort remaining by word count
    const sorted = remaining.sort((a, b) => {
      const wordsA = a.content.split(/\s+/).length;
      const wordsB = b.content.split(/\s+/).length;
      return wordsB - wordsA;
    });

    // Divide into thirds (long, medium, short)
    const third = Math.ceil(sorted.length / 3);
    const strata = [
      sorted.slice(0, third), // Long posts
      sorted.slice(third, third * 2), // Medium posts
      sorted.slice(third * 2), // Short posts
    ];

    // Sample from each stratum in round-robin fashion
    let strataIndex = 0;
    while (samples.length < sampleSize) {
      const stratum = strata[strataIndex % 3];
      if (stratum.length > 0) {
        // Random selection from this stratum
        const randomIndex = Math.floor(Math.random() * stratum.length);
        samples.push(stratum[randomIndex]);
        stratum.splice(randomIndex, 1);
      }
      strataIndex++;

      // Break if all strata are empty
      if (strata.every((s) => s.length === 0)) break;
    }
  }

  return samples.slice(0, sampleSize);
}

/**
 * Construct prompt for cluster labeling
 * Returns a concise, semantic theme label
 */
function buildClusterPrompt(samples: ArticleData[]): string {
  const sampleDescriptions = samples
    .map((s, i) => {
      const contentPreview = s.content
        .substring(0, 200)
        .replace(/\s+/g, " ")
        .trim();
      const tags = s.tags && s.tags.length > 0 ? s.tags.join(", ") : "none";
      const date = s.publishedDate || "unknown";

      return `${i + 1}. "${s.postTitle}"
   Published: ${date}
   Tags: ${tags}
   Content preview: ${contentPreview}...`;
    })
    .join("\n\n");

  return `Analyze these blog posts and create a SHORT, CONCRETE label that describes what they're actually about. Look at the titles and content - what topics, activities, or subjects appear across these posts?

Posts in this cluster:
${sampleDescriptions}

Create a label that is:
- CONCRETE and SPECIFIC (not abstract philosophy)
- ALL LOWERCASE
- 2-4 words maximum
- Based on actual topics/subjects that appear in the posts
- Describes WHAT the posts are about, not how they feel

Good examples (concrete, topic-based):
- "machine learning projects"
- "travel photography"
- "cooking experiments"
- "book reviews"
- "sf city life"
- "career reflections"
- "coding tutorials"

Bad examples (too vague/philosophical):
- "finding meaning in experience"
- "navigating transitions"
- "moments of presence"
- "learning in motion"

Look at the actual content and give me a straightforward topic label:`;
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
 * Helper to wait for a specified duration
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    minSamplesPerCluster = CLUSTER_LABEL_MIN_SAMPLES,
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
      const samples = selectClusterSamples(
        articles,
        minSamplesPerCluster,
        maxSamplesPerCluster
      );

      // Build prompt
      const prompt = buildClusterPrompt(samples);

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
