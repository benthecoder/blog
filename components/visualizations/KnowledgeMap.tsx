"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { scaleLinear } from "d3-scale";
import { zoom as d3Zoom } from "d3-zoom";
import { select } from "d3-selection";
import UMAPLoader from "./UMAPLoader";

interface Article {
  id: string;
  postSlug: string;
  postTitle: string;
  content: string;
  embedding: number[];
  publishedDate?: string;
  tags?: string[];
  x: number;
  y: number;
  cluster: number;
}

interface KnowledgeMapData {
  success: boolean;
  data: Article[];
  count: number;
  numClusters: number;
  clusterLabels?: Record<number, string>;
  generatedAt: string;
}

// Four distinct shapes rotated per cluster — adds a visual channel beyond color
const SHAPES = ["circle", "square", "diamond", "triangle"] as const;
type Shape = (typeof SHAPES)[number];

function drawMarker(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  y: number,
  r: number
) {
  ctx.beginPath();
  switch (shape) {
    case "circle":
      ctx.arc(x, y, r, 0, Math.PI * 2);
      break;
    case "square":
      ctx.rect(x - r, y - r, r * 2, r * 2);
      break;
    case "diamond":
      ctx.moveTo(x, y - r * 1.3);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r * 1.3);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      break;
    case "triangle":
      ctx.moveTo(x, y - r * 1.2);
      ctx.lineTo(x + r * 1.1, y + r * 0.7);
      ctx.lineTo(x - r * 1.1, y + r * 0.7);
      ctx.closePath();
      break;
  }
}

export default function KnowledgeMap({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [clusterLabels, setClusterLabels] = useState<Record<number, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredArticle, setHoveredArticle] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [canvasReady, setCanvasReady] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoomBehaviorRef = useRef<any>(null);
  const selectedArticleRef = useRef<Article | null>(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    selectedArticleRef.current = selectedArticle;
  }, [selectedArticle]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/data/knowledge-map.json");
      const result: KnowledgeMapData = await response.json();
      if (result.success) {
        setArticles(result.data);
        setClusterLabels(result.clusterLabels || {});
      } else {
        setError("failed to load");
      }
    } catch {
      setError("error loading data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = articles.filter((article) => {
    if (
      searchQuery &&
      !article.postTitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedCluster !== null && article.cluster !== selectedCluster) {
      return false;
    }
    return true;
  });

  const similarity = useCallback((a: number[], b: number[]): number => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  }, []);

  const getClusterColor = useCallback(
    (cluster: number, isDark: boolean): string => {
      if (cluster === -1) {
        return isDark ? "#91989C" : "#595857";
      }
      const hue = (cluster * 137.5) % 360;
      const saturation = isDark ? 60 : 55;
      const lightness = isDark ? 60 : 50;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    []
  );

  // Refs to avoid stale closures
  const transformRef = useRef(transform);
  const hoveredArticleRef = useRef(hoveredArticle);
  const filteredRef = useRef(filtered);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  useEffect(() => {
    hoveredArticleRef.current = hoveredArticle;
  }, [hoveredArticle]);
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  // Render
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (filtered.length === 0) return;

    const xScale = scaleLinear().domain([0, 1000]).range([0, width]);
    const yScale = scaleLinear().domain([0, 1000]).range([0, height]);
    const isDark = theme === "dark";

    const styles = getComputedStyle(document.documentElement);
    const dotDefault = isDark
      ? styles.getPropertyValue("--color-japanese-ginnezu").trim() || "#91989C"
      : styles.getPropertyValue("--color-japanese-sumiiro").trim() || "#595857";
    const dotHover = isDark ? "#DCDDDD" : "#000000";
    const connectionColor = isDark
      ? "rgba(145, 152, 156, 0.08)"
      : "rgba(89, 88, 87, 0.08)";

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Similarity connections on hover/select
    const focusedArticle = selectedArticle ?? hoveredArticle;
    if (focusedArticle) {
      filtered.forEach((other) => {
        if (other.id === focusedArticle.id) return;
        const sim = similarity(focusedArticle.embedding, other.embedding);
        if (sim > 0.7) {
          ctx.beginPath();
          ctx.moveTo(xScale(focusedArticle.x), yScale(focusedArticle.y));
          ctx.lineTo(xScale(other.x), yScale(other.y));
          ctx.strokeStyle = connectionColor;
          ctx.lineWidth = 1 / transform.k;
          ctx.stroke();
        }
      });
    }

    // Cluster centroid labels — drawn before dots so dots sit on top
    const centroids: Record<number, { sx: number; sy: number; count: number }> =
      {};
    filtered.forEach((a) => {
      if (!centroids[a.cluster])
        centroids[a.cluster] = { sx: 0, sy: 0, count: 0 };
      centroids[a.cluster].sx += a.x;
      centroids[a.cluster].sy += a.y;
      centroids[a.cluster].count++;
    });

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    Object.entries(centroids).forEach(([clusterId, { sx, sy, count }]) => {
      const id = Number(clusterId);
      const label = clusterLabels[id];
      if (!label || id === -1) return;
      const cx = xScale(sx / count);
      const cy = yScale(sy / count);
      // Font size stays proportionally constant as you zoom
      const fontSize = Math.max(7, 9 / transform.k);
      ctx.font = `${fontSize}px ui-serif, Georgia, serif`;
      ctx.fillStyle = isDark
        ? "rgba(220, 221, 221, 0.25)"
        : "rgba(89, 88, 87, 0.2)";
      // Truncate long labels
      const words = label.split(" ").slice(0, 3).join(" ");
      ctx.fillText(words, cx, cy - 12 / transform.k);
    });

    // Dots
    filtered.forEach((article) => {
      const x = xScale(article.x);
      const y = yScale(article.y);
      const wordCount = article.content.split(/\s+/).length;
      const size = Math.max(1.5, Math.min(4, Math.log(wordCount + 1) * 0.6));
      const baseOpacity = Math.min(0.8, 0.3 + wordCount / 2000);
      const shape = SHAPES[Math.abs(article.cluster) % SHAPES.length];

      const isSelected = article.id === selectedArticle?.id;
      const isHovered = article.id === hoveredArticle?.id;

      let color = getClusterColor(article.cluster, isDark);
      let opacity = baseOpacity;

      if (isSelected || isHovered) {
        color = dotHover;
        opacity = 1;
      } else if (
        searchQuery &&
        article.postTitle.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        color = dotDefault;
        opacity = 0.8;
      }

      // Outer rings for selected article
      if (isSelected) {
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 / transform.k;
        ctx.stroke();

        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 / transform.k;
        ctx.stroke();
      }

      ctx.globalAlpha = opacity;
      drawMarker(ctx, shape, x, y, size);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [
    filtered,
    theme,
    transform,
    hoveredArticle,
    selectedArticle,
    searchQuery,
    similarity,
    getClusterColor,
    clusterLabels,
    canvasReady,
  ]);

  // Canvas init and event wiring
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || articles.length === 0)
      return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const zoomBehavior = d3Zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        setTransform({
          k: event.transform.k,
          x: event.transform.x,
          y: event.transform.y,
        });
      });

    zoomBehaviorRef.current = zoomBehavior;
    const selection = select(canvas);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection.call(zoomBehavior as any);
    setCanvasReady(true);

    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      canvas.style.width = `${newRect.width}px`;
      canvas.style.height = `${newRect.height}px`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selection.call(zoomBehavior as any);
    };

    // Shared hit-test: returns closest article within threshold
    function hitTest(clientX: number, clientY: number): Article | null {
      const r = canvas.getBoundingClientRect();
      const t = transformRef.current;
      const x = (clientX - r.left - t.x) / t.k;
      const y = (clientY - r.top - t.y) / t.k;

      const xScale = scaleLinear().domain([0, 1000]).range([0, r.width]);
      const yScale = scaleLinear().domain([0, 1000]).range([0, r.height]);

      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      const threshold = isTouch ? 24 : 12;

      let closest: Article | null = null;
      let minDist = threshold;

      filteredRef.current.forEach((article) => {
        const dx = xScale(article.x) - x;
        const dy = yScale(article.y) - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = article;
        }
      });

      return closest;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const closest = hitTest(e.clientX, e.clientY);
      canvas.style.cursor = closest ? "pointer" : "crosshair";
      setHoveredArticle(closest);
    };

    // Two-step click: first click → pin detail panel; second click on same dot → navigate
    const handleClick = (e: MouseEvent) => {
      const closest = hitTest(e.clientX, e.clientY);

      if (!closest) {
        setSelectedArticle(null);
        return;
      }

      if (selectedArticleRef.current?.id === closest.id) {
        window.location.href = `/posts/${closest.postSlug}`;
      } else {
        setSelectedArticle(closest);
      }
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      selection.on(".zoom", null);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [articles.length]);

  if (loading) return <UMAPLoader className={className} />;

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const displayArticle = selectedArticle ?? hoveredArticle;
  const isPinned = selectedArticle !== null;

  return (
    <div
      ref={containerRef}
      className={`relative ${className} bg-japanese-kinairo dark:bg-dark-bg`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Search */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <input
          type="text"
          placeholder="search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-40 px-2 py-1 text-xs bg-japanese-kinairo/90 dark:bg-dark-bg/90 text-japanese-sumiiro dark:text-japanese-shironezu border border-japanese-shiraumenezu dark:border-white/[0.08] focus:outline-none placeholder:text-japanese-sumiiro/30 dark:placeholder:text-japanese-shironezu/30 pointer-events-auto backdrop-blur-sm"
        />
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ background: "transparent" }}
      />

      {/* Article detail panel — hover preview or pinned detail */}
      {displayArticle && (
        <div
          className={`absolute top-4 right-4 z-20 bg-japanese-kinairo/95 dark:bg-dark-bg/95 p-3 border shadow-sm max-w-[200px] sm:max-w-xs backdrop-blur-sm transition-[border-color] duration-150 ${
            isPinned
              ? "border-japanese-sumiiro/25 dark:border-white/[0.15] pointer-events-auto"
              : "border-japanese-shiraumenezu dark:border-white/[0.08] pointer-events-none"
          }`}
        >
          {isPinned && (
            <button
              onClick={() => setSelectedArticle(null)}
              aria-label="close"
              className="absolute top-1.5 right-2 text-japanese-sumiiro/30 hover:text-japanese-sumiiro/70 dark:text-japanese-shironezu/30 dark:hover:text-japanese-shironezu/70 transition-colors text-base leading-none"
            >
              ×
            </button>
          )}

          <h3 className="font-medium text-sm leading-tight mb-2 text-japanese-sumiiro dark:text-japanese-shironezu pr-4">
            {displayArticle.postTitle}
          </h3>

          <div className="space-y-1 text-xs text-japanese-sumiiro/60 dark:text-japanese-shironezu/60">
            {clusterLabels[displayArticle.cluster] && (
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: getClusterColor(
                      displayArticle.cluster,
                      theme === "dark"
                    ),
                  }}
                />
                <span className="font-medium text-japanese-sumiiro dark:text-japanese-shironezu">
                  {clusterLabels[displayArticle.cluster]}
                </span>
              </div>
            )}
            {displayArticle.publishedDate && (
              <p>
                {new Date(displayArticle.publishedDate).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </p>
            )}
            <p>{displayArticle.content.split(/\s+/).length} words</p>
            {displayArticle.tags && displayArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {displayArticle.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-1 py-0.5 bg-japanese-shiraumenezu/40 dark:bg-white/[0.06] text-xs text-japanese-sumiiro/70 dark:text-japanese-shironezu/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isPinned ? (
            <Link
              href={`/posts/${displayArticle.postSlug}`}
              className="mt-3 flex items-center gap-1 text-xs text-japanese-sumiiro/50 hover:text-japanese-sumiiro dark:text-japanese-shironezu/50 dark:hover:text-japanese-shironezu transition-colors"
            >
              read →
            </Link>
          ) : (
            <p className="mt-2 text-[10px] text-japanese-sumiiro/25 dark:text-japanese-shironezu/25">
              {isTouchDevice ? "tap again to read" : "click to pin"}
            </p>
          )}
        </div>
      )}

      {/* Cluster legend toggle */}
      {Object.keys(clusterLabels).length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="bg-japanese-kinairo/90 dark:bg-dark-bg/90 px-2 py-1 border border-japanese-shiraumenezu dark:border-white/[0.08] text-xs text-japanese-sumiiro/60 dark:text-japanese-shironezu/60 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors backdrop-blur-sm"
          >
            {showLegend
              ? "hide"
              : selectedCluster !== null
                ? `cluster: ${clusterLabels[selectedCluster]}`
                : "clusters"}
          </button>
          {showLegend && (
            <div className="absolute bottom-8 right-0 bg-japanese-kinairo/95 dark:bg-dark-bg/95 px-3 py-2 border border-japanese-shiraumenezu dark:border-white/[0.08] max-h-[60vh] overflow-y-auto shadow-sm min-w-[200px] backdrop-blur-sm">
              {selectedCluster !== null && (
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="w-full mb-2 px-2 py-1 text-xs bg-japanese-shiraumenezu/30 dark:bg-white/[0.06] hover:bg-japanese-shiraumenezu/50 dark:hover:bg-white/[0.10] transition-colors"
                >
                  show all clusters
                </button>
              )}
              <div className="space-y-0.5">
                {Object.entries(clusterLabels)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([clusterId, label]) => {
                    const id = Number(clusterId);
                    const count = articles.filter(
                      (a) => a.cluster === id
                    ).length;
                    const isActive = selectedCluster === id;
                    return (
                      <button
                        key={clusterId}
                        onClick={() => setSelectedCluster(isActive ? null : id)}
                        className={`w-full flex items-center gap-2 text-xs py-0.5 px-1 rounded transition-colors ${
                          isActive
                            ? "bg-japanese-shiraumenezu/40 dark:bg-white/[0.06]"
                            : "hover:bg-japanese-shiraumenezu/20 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: getClusterColor(
                              id,
                              theme === "dark"
                            ),
                          }}
                        />
                        <span className="text-japanese-sumiiro/70 dark:text-japanese-shironezu/70 text-left">
                          {label}{" "}
                          <span className="text-japanese-sumiiro/40 dark:text-japanese-shironezu/40">
                            ({count})
                          </span>
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-japanese-kinairo/80 dark:bg-dark-bg/80 px-3 py-1 border border-japanese-shiraumenezu dark:border-white/[0.08] text-xs text-japanese-sumiiro/40 dark:text-japanese-shironezu/40 pointer-events-none backdrop-blur-sm">
        {isTouchDevice
          ? "pinch to zoom · drag to pan · tap to preview"
          : "scroll to zoom · drag to pan · click to pin · click again to read"}
      </div>
    </div>
  );
}
