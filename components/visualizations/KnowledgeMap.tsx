"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { scaleLinear } from "d3-scale";
import { zoom as d3Zoom, ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import type { ArticleNode, KnowledgeMapOutput } from "@/types/knowledgeMap";
import UMAPLoader from "./UMAPLoader";

export default function KnowledgeMap({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<ArticleNode[]>([]);
  const [clusterLabels, setClusterLabels] = useState<Record<number, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredArticleNode, setHoveredArticleNode] =
    useState<ArticleNode | null>(null);
  const [selectedArticleNode, setSelectedArticleNode] =
    useState<ArticleNode | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { theme } = useTheme();
  const zoomBehaviorRef = useRef<ZoomBehavior<Element, unknown> | null>(null);
  const selectedArticleNodeRef = useRef<ArticleNode | null>(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    selectedArticleNodeRef.current = selectedArticleNode;
  }, [selectedArticleNode]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/data/knowledge-map.json");
      const result: KnowledgeMapOutput = await response.json();
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
      const saturation = isDark ? 52 : 47;
      const lightness = isDark ? 62 : 50;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    []
  );

  const transformRef = useRef(transform);
  const hoveredArticleNodeRef = useRef(hoveredArticleNode);
  const filteredRef = useRef(filtered);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  useEffect(() => {
    hoveredArticleNodeRef.current = hoveredArticleNode;
  }, [hoveredArticleNode]);
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

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Similarity connections on hover/select — opacity scales with similarity
    const focusedArticleNode = selectedArticleNode ?? hoveredArticleNode;
    if (focusedArticleNode) {
      filtered.forEach((other) => {
        if (other.id === focusedArticleNode.id) return;
        const sim = similarity(focusedArticleNode.embedding, other.embedding);
        if (sim > 0.7) {
          const alpha = Math.max(0.06, (sim - 0.7) * 0.5);
          ctx.beginPath();
          ctx.moveTo(
            xScale(focusedArticleNode.x),
            yScale(focusedArticleNode.y)
          );
          ctx.lineTo(xScale(other.x), yScale(other.y));
          ctx.strokeStyle = isDark
            ? `rgba(145, 152, 156, ${alpha})`
            : `rgba(89, 88, 87, ${alpha})`;
          ctx.lineWidth = 0.8 / transform.k;
          ctx.stroke();
        }
      });
    }

    // Cluster centroid labels
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
      const fontSize = Math.max(7, 9 / transform.k);
      ctx.font = `${fontSize}px ui-serif, Georgia, serif`;
      const labelY = cy - 12 / transform.k;
      ctx.fillStyle = isDark ? "rgba(220,221,221,0.38)" : "rgba(89,88,87,0.38)";
      ctx.fillText(label, cx, labelY);
    });

    // Dots — circles only
    filtered.forEach((article) => {
      const x = xScale(article.x);
      const y = yScale(article.y);
      const wordCount = article.wordCount;
      const size = Math.max(2, Math.min(3.5, Math.log(wordCount + 1) * 0.55));
      const baseOpacity = Math.min(0.78, 0.45 + wordCount / 2500);

      const isSelected = article.id === selectedArticleNode?.id;
      const isHovered = article.id === hoveredArticleNode?.id;

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
        opacity = 0.85;
      }

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [
    filtered,
    theme,
    transform,
    hoveredArticleNode,
    selectedArticleNode,
    searchQuery,
    similarity,
    getClusterColor,
    clusterLabels,
    canvasVersion,
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
    const selection = select<Element, unknown>(canvas);
    selection.call(zoomBehavior);
    setCanvasVersion((v) => v + 1);

    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      canvas.style.width = `${newRect.width}px`;
      canvas.style.height = `${newRect.height}px`;
      selection.call(zoomBehavior);
      setCanvasVersion((v) => v + 1);
    };

    function hitTest(clientX: number, clientY: number): ArticleNode | null {
      const r = canvas.getBoundingClientRect();
      const t = transformRef.current;
      const x = (clientX - r.left - t.x) / t.k;
      const y = (clientY - r.top - t.y) / t.k;

      const xScale = scaleLinear().domain([0, 1000]).range([0, r.width]);
      const yScale = scaleLinear().domain([0, 1000]).range([0, r.height]);

      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      const threshold = isTouch ? 24 : 12;

      let closest: ArticleNode | null = null;
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
      setHoveredArticleNode(closest);
    };

    const handleClick = (e: MouseEvent) => {
      const closest = hitTest(e.clientX, e.clientY);

      if (!closest) {
        setSelectedArticleNode(null);
        setClickPos(null);
        return;
      }

      if (selectedArticleNodeRef.current?.id === closest.id) {
        window.location.href = `/posts/${closest.postSlug}`;
      } else {
        const cr = containerRef.current!.getBoundingClientRect();
        setClickPos({ x: e.clientX - cr.left, y: e.clientY - cr.top });
        setSelectedArticleNode(closest);
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

  const displayArticleNode = selectedArticleNode ?? hoveredArticleNode;
  const isPinned = selectedArticleNode !== null;

  const getPanelPosition = () => {
    if (!isPinned || !clickPos || !containerRef.current)
      return { top: "1rem", right: "1rem" };
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const W = 240;
    const H = 160;
    const GAP = 12;
    let left = clickPos.x + GAP;
    let top = clickPos.y + GAP;
    if (left + W > cw - 8) left = clickPos.x - W - GAP;
    if (top + H > ch - 8) top = clickPos.y - H - GAP;
    return { left: Math.max(8, left), top: Math.max(8, top) };
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className} bg-japanese-kinairo dark:bg-dark-bg`}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="absolute top-4 left-4 z-20 w-36 px-2 py-1 text-xs bg-japanese-kinairo/90 dark:bg-dark-bg/90 text-japanese-sumiiro dark:text-japanese-shironezu border border-japanese-shiraumenezu dark:border-white/[0.08] focus:outline-none placeholder:text-japanese-sumiiro/25 dark:placeholder:text-japanese-shironezu/25 backdrop-blur-sm"
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ background: "transparent" }}
      />

      {/* ArticleNode detail panel — hover preview or pinned detail */}
      {displayArticleNode && (
        <div
          className={`absolute z-20 bg-japanese-kinairo/95 dark:bg-dark-bg/95 p-3 border shadow-sm w-[200px] sm:w-56 backdrop-blur-sm transition-[border-color] duration-150 pointer-events-none ${
            isPinned
              ? "border-japanese-sumiiro/25 dark:border-white/[0.15]"
              : "border-japanese-shiraumenezu dark:border-white/[0.08]"
          }`}
          style={getPanelPosition()}
        >
          {isPinned && (
            <button
              onClick={() => {
                setSelectedArticleNode(null);
                setClickPos(null);
              }}
              aria-label="close"
              className="pointer-events-auto absolute top-1.5 right-2 text-japanese-sumiiro/30 hover:text-japanese-sumiiro/70 dark:text-japanese-shironezu/30 dark:hover:text-japanese-shironezu/70 transition-colors text-base leading-none"
            >
              ×
            </button>
          )}

          <h3 className="font-medium text-sm leading-tight mb-2 text-japanese-sumiiro dark:text-japanese-shironezu pr-4">
            {displayArticleNode.postTitle}
          </h3>

          <div className="space-y-1 text-xs text-japanese-sumiiro/60 dark:text-japanese-shironezu/60">
            {clusterLabels[displayArticleNode.cluster] && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: getClusterColor(
                      displayArticleNode.cluster,
                      theme === "dark"
                    ),
                  }}
                />
                <span>{clusterLabels[displayArticleNode.cluster]}</span>
              </div>
            )}
            {displayArticleNode.publishedDate && (
              <p>
                {new Date(displayArticleNode.publishedDate).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </p>
            )}
          </div>

          {isPinned ? (
            <Link
              href={`/posts/${displayArticleNode.postSlug}`}
              className="pointer-events-auto mt-3 flex items-center gap-1 text-xs text-japanese-sumiiro/50 hover:text-japanese-sumiiro dark:text-japanese-shironezu/50 dark:hover:text-japanese-shironezu transition-colors"
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
        {isTouchDevice ? "pinch · drag · tap" : "scroll · drag · click"}
      </div>
    </div>
  );
}
