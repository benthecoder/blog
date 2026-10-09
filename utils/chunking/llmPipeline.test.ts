import { beforeEach, describe, expect, it, vi } from "vitest";

const { FakeRateLimit, generateStructured } = vi.hoisted(() => ({
  FakeRateLimit: class extends Error {},
  generateStructured: vi.fn(),
}));
vi.mock("../llm", () => ({
  generateStructured: (...args: unknown[]) => generateStructured(...args),
  hasLlmKey: () => true,
  RateLimitError: FakeRateLimit,
}));

import { labelClusters, validLabels } from "./clusterLabeling";
import { summarizePending, type SummaryCache } from "./postSummaries";
import type { ArticleData } from "@/types/knowledgeMap";

const item = (slug: string) => ({
  slug,
  title: slug,
  tags: "",
  text: "text",
  hash: `h-${slug}`,
});
const good = (id: string) => ({
  id,
  summary: `A reasonably long summary of the ideas in ${id}.`,
});

beforeEach(() => generateStructured.mockReset());

describe("summarizePending", () => {
  it("batches posts, caches results and retries only failed slugs", async () => {
    generateStructured
      .mockResolvedValueOnce({ summaries: [good("a"), good("b")] }) // c missing
      .mockResolvedValueOnce({ summaries: [good("c")] });
    const cache: SummaryCache = {};
    const saved = vi.fn();
    const out = await summarizePending(
      [item("a"), item("b"), item("c")],
      cache,
      saved,
      { batchSize: 3, maxRequests: 5 }
    );
    expect(out).toEqual({ requests: 2, stoppedBy: "done" });
    expect(Object.keys(cache).sort()).toEqual(["a", "b", "c"]);
    expect(cache.a.hash).toBe("h-a");
    expect(generateStructured.mock.calls[1][0].prompt).not.toContain("### a");
    expect(saved).toHaveBeenCalledTimes(2);
  });

  it("stops cleanly on a rate limit and keeps what it has", async () => {
    generateStructured
      .mockResolvedValueOnce({ summaries: [good("a")] })
      .mockRejectedValueOnce(new FakeRateLimit("429"));
    const cache: SummaryCache = {};
    const out = await summarizePending(
      [item("a"), item("b")],
      cache,
      () => {},
      { batchSize: 1, maxRequests: 5 }
    );
    expect(out.stoppedBy).toBe("rate-limit");
    expect(Object.keys(cache)).toEqual(["a"]);
  });

  it("respects the request budget", async () => {
    generateStructured.mockResolvedValue({ summaries: [good("a")] });
    const out = await summarizePending([item("a"), item("b")], {}, () => {}, {
      batchSize: 1,
      maxRequests: 1,
    });
    expect(out.stoppedBy).toBe("budget");
    expect(generateStructured).toHaveBeenCalledTimes(1);
  });
});

describe("labels", () => {
  it("rejects unknown, duplicate and already-taken labels, lowercasing the rest", () => {
    const out = validLabels(
      {
        labels: [
          { cluster: 0, label: "ML Infrastructure" },
          { cluster: 1, label: "ml infrastructure" },
          { cluster: 2, label: "taken one" },
          { cluster: 9, label: "unknown" },
        ],
      },
      [0, 1, 2],
      ["taken one"]
    );
    expect([...out]).toEqual([[0, "ml infrastructure"]]);
  });

  it("labels every cluster in a single request and leaves noise unlabeled", async () => {
    generateStructured.mockResolvedValueOnce({
      labels: [
        { cluster: 0, label: "chronic pain" },
        { cluster: 1, label: "ml systems" },
      ],
    });
    const article = (slug: string, cluster: number) =>
      ({
        postSlug: slug,
        postTitle: slug,
        content: "body",
        summary: `summary of ${slug}`,
        cluster,
      }) as unknown as ArticleData;
    const labels = await labelClusters(
      new Map([
        [0, [article("a", 0)]],
        [1, [article("b", 1)]],
        [-1, [article("c", -1)]],
      ])
    );
    expect(generateStructured).toHaveBeenCalledTimes(1);
    expect(generateStructured.mock.calls[0][0].prompt).toContain(
      "summary of a"
    );
    expect(labels.get(0)).toBe("chronic pain");
    expect(labels.get(1)).toBe("ml systems");
    expect(labels.has(-1)).toBe(false);
  });
});
