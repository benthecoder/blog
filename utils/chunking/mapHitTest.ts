import type { ArticleNode } from "@/types/knowledgeMap";

/** Match the map's unclamped [0, 1000] scales using squared pixel distances. */
export function findNearestMapNode(
  articles: readonly ArticleNode[],
  point: { x: number; y: number },
  viewport: { width: number; height: number },
  radius: number
): ArticleNode | null {
  if (radius <= 0) return null;

  let closest: ArticleNode | null = null;
  let distanceSquared = radius * radius;
  const scaleX = viewport.width / 1000;
  const scaleY = viewport.height / 1000;
  for (const article of articles) {
    const dx = article.x * scaleX - point.x;
    const dy = article.y * scaleY - point.y;
    const distance = dx * dx + dy * dy;
    if (distance < distanceSquared) {
      distanceSquared = distance;
      closest = article;
    }
  }
  return closest;
}
