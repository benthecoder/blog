"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [canvasReady, setCanvasReady] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoomBehaviorRef = useRef<any>(null);

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

  // Filter articles
  const filtered = articles.filter((article) => {
    // Filter by search query
    if (
      searchQuery &&
      !article.postTitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    // Filter by selected cluster
    if (selectedCluster !== null && article.cluster !== selectedCluster) {
      return false;
    }
    return true;
  });

  // Cosine similarity
  const similarity = useCallback((a: number[], b: number[]): number => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  }, []);

  // Generate color palette for clusters
  const getClusterColor = useCallback(
    (cluster: number, isDark: boolean): string => {
      if (cluster === -1) {
        // Noise points - use default color
        return isDark ? "#91989C" : "#595857";
      }

      // HSL color palette with good contrast
      const hue = (cluster * 137.5) % 360; // Golden angle for good distribution
      const saturation = isDark ? 60 : 55;
      const lightness = isDark ? 60 : 50;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    []
  );

  // Render (drawing only, no dimension changes)
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

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(dpr, dpr);

    // Clear canvas (transparent to show container background with texture)
    ctx.clearRect(0, 0, width, height);

    // Early return if no results
    if (filtered.length === 0) return;

    const xScale = scaleLinear().domain([0, 1000]).range([0, width]);
    const yScale = scaleLinear().domain([0, 1000]).range([0, height]);

    const isDark = theme === "dark";

    // Get colors from CSS variables (from your Tailwind theme)
    const styles = getComputedStyle(document.documentElement);
    const dot = isDark
      ? styles.getPropertyValue("--color-japanese-ginnezu").trim() || "#91989C"
      : styles.getPropertyValue("--color-japanese-sumiiro").trim() || "#595857";
    const dotHover = isDark
      ? styles.getPropertyValue("--color-japanese-shironezu").trim() ||
        "#DCDDDD"
      : "#000000";
    const dotSelected = dot;
    const connection = isDark
      ? "rgba(145, 152, 156, 0.08)"
      : "rgba(89, 88, 87, 0.08)";

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Draw connections on hover
    if (hoveredArticle) {
      filtered.forEach((other) => {
        if (other.id === hoveredArticle.id) return;
        const sim = similarity(hoveredArticle.embedding, other.embedding);
        if (sim > 0.7) {
          ctx.beginPath();
          ctx.moveTo(xScale(hoveredArticle.x), yScale(hoveredArticle.y));
          ctx.lineTo(xScale(other.x), yScale(other.y));
          ctx.strokeStyle = connection;
          ctx.lineWidth = 1 / transform.k;
          ctx.stroke();
        }
      });
    }

    // Draw articles as precise, minimal dots
    filtered.forEach((article) => {
      const x = xScale(article.x);
      const y = yScale(article.y);

      // Smaller, more precise sizing
      const wordCount = article.content.split(/\s+/).length;
      const size = Math.max(1.5, Math.min(4, Math.log(wordCount + 1) * 0.6));

      // Opacity varies by word count (longer posts = more opaque)
      const baseOpacity = Math.min(0.8, 0.3 + wordCount / 2000);

      // Use cluster color
      let color = getClusterColor(article.cluster, isDark);
      let opacity = baseOpacity;

      if (article.id === hoveredArticle?.id) {
        color = dotHover;
        opacity = 1;
      } else if (
        searchQuery &&
        article.postTitle.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        color = dotSelected;
        opacity = 0.8;
      }

      // Draw crisp, minimal circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Minimal stroke only for hovered (Tufte: remove chartjunk)
      if (article.id === hoveredArticle?.id) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [
    filtered,
    theme,
    transform,
    hoveredArticle,
    searchQuery,
    similarity,
    getClusterColor,
    canvasReady,
  ]);

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

  // Canvas initialization and zoom setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || articles.length === 0)
      return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Initialize canvas dimensions ONCE
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Set up zoom behavior
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

    // Force initial render after canvas is set up
    setCanvasReady(true);

    // Handle window resize
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      canvas.style.width = `${newRect.width}px`;
      canvas.style.height = `${newRect.height}px`;

      // Re-apply zoom behavior after canvas reset
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selection.call(zoomBehavior as any);
    };

    window.addEventListener("resize", handleResize);

    // Handle mouse move for hover
    const handleNativeMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentTransform = transformRef.current;
      const x =
        (e.clientX - rect.left - currentTransform.x) / currentTransform.k;
      const y =
        (e.clientY - rect.top - currentTransform.y) / currentTransform.k;

      const width = rect.width;
      const height = rect.height;
      const xScale = scaleLinear().domain([0, 1000]).range([0, width]);
      const yScale = scaleLinear().domain([0, 1000]).range([0, height]);

      let closest: Article | null = null;
      let minDist = 12;

      filteredRef.current.forEach((article) => {
        const dx = xScale(article.x) - x;
        const dy = yScale(article.y) - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = article;
        }
      });

      setHoveredArticle(closest);
    };

    // Handle click for navigation
    const handleNativeClick = () => {
      const currentHovered = hoveredArticleRef.current;
      if (currentHovered) {
        window.location.href = `/posts/${currentHovered.postSlug}`;
      }
    };

    canvas.addEventListener("mousemove", handleNativeMouseMove);
    canvas.addEventListener("click", handleNativeClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      selection.on(".zoom", null);
      canvas.removeEventListener("mousemove", handleNativeMouseMove);
      canvas.removeEventListener("click", handleNativeClick);
    };
  }, [articles.length]);

  if (loading) {
    return <UMAPLoader className={className} />;
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className} bg-japanese-kinairo dark:bg-[#1a1a1a]`}
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
          className="w-40 px-2 py-1 text-xs bg-japanese-kinairo/90 dark:bg-[#1a1a1a]/90 text-japanese-sumiiro dark:text-japanese-shironezu border border-japanese-shiraumenezu dark:border-white/[0.08] focus:outline-none placeholder:text-japanese-sumiiro/30 dark:placeholder:text-japanese-shironezu/30 pointer-events-auto backdrop-blur-sm"
        />
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="cursor-crosshair w-full h-full block"
        style={{ background: "transparent" }}
      />

      {/* Article Detail on Hover */}
      {hoveredArticle && (
        <div className="absolute top-4 right-4 z-20 bg-japanese-kinairo/95 dark:bg-[#1a1a1a]/95 p-3 border border-japanese-shiraumenezu dark:border-white/[0.08] shadow-sm max-w-xs pointer-events-none backdrop-blur-sm">
          <h3 className="font-medium text-sm leading-tight mb-2 text-japanese-sumiiro dark:text-japanese-shironezu">
            {hoveredArticle.postTitle}
          </h3>
          <div className="space-y-1 text-xs text-japanese-sumiiro/60 dark:text-japanese-shironezu/60">
            {clusterLabels[hoveredArticle.cluster] && (
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: getClusterColor(
                      hoveredArticle.cluster,
                      theme === "dark"
                    ),
                  }}
                />
                <span className="font-medium text-japanese-sumiiro dark:text-japanese-shironezu">
                  {clusterLabels[hoveredArticle.cluster]}
                </span>
              </div>
            )}
            {hoveredArticle.publishedDate && (
              <p>
                {new Date(hoveredArticle.publishedDate).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </p>
            )}
            <p>{hoveredArticle.content.split(/\s+/).length} words</p>
            {hoveredArticle.tags && hoveredArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {hoveredArticle.tags.map((tag, i) => (
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
        </div>
      )}

      {/* Cluster Legend Toggle */}
      {Object.keys(clusterLabels).length > 0 && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="bg-japanese-kinairo/90 dark:bg-[#1a1a1a]/90 px-2 py-1 border border-japanese-shiraumenezu dark:border-white/[0.08] text-xs text-japanese-sumiiro/60 dark:text-japanese-shironezu/60 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors backdrop-blur-sm"
          >
            {showLegend
              ? "hide"
              : selectedCluster !== null
                ? `cluster: ${clusterLabels[selectedCluster]}`
                : "clusters"}
          </button>
          {showLegend && (
            <div className="absolute bottom-8 right-0 bg-japanese-kinairo/95 dark:bg-[#1a1a1a]/95 px-3 py-2 border border-japanese-shiraumenezu dark:border-white/[0.08] max-h-[60vh] overflow-y-auto shadow-sm min-w-[200px] backdrop-blur-sm">
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
                    const isSelected = selectedCluster === id;
                    return (
                      <button
                        key={clusterId}
                        onClick={() =>
                          setSelectedCluster(isSelected ? null : id)
                        }
                        className={`w-full flex items-center gap-2 text-xs py-0.5 px-1 rounded transition-colors ${
                          isSelected
                            ? "bg-japanese-shiraumenezu/40 dark:bg-white/[0.06]"
                            : "hover:bg-japanese-shiraumenezu/20 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
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
      <div className="absolute bottom-4 left-4 z-10 bg-japanese-kinairo/80 dark:bg-[#1a1a1a]/80 px-3 py-1 border border-japanese-shiraumenezu dark:border-white/[0.08] text-xs text-japanese-sumiiro/40 dark:text-japanese-shironezu/40 pointer-events-none backdrop-blur-sm">
        scroll to zoom • drag to pan • click to read
      </div>
    </div>
  );
}
