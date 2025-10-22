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
}

export default function KnowledgeMap({
  className = "",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredArticle, setHoveredArticle] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [neighbors] = useState(4);
  const [minDist] = useState(0.05);
  const [spread] = useState(6.0);
  const { theme } = useTheme();

  // Fetch data from static JSON file
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/data/knowledge-map.json");
      const result = await response.json();
      if (result.success) {
        setArticles(result.data);
      } else {
        setError("failed to load");
      }
    } catch {
      setError("error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter articles
  const filtered = articles.filter((article) => {
    if (!searchQuery) return true;
    return article.postTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Cosine similarity
  const similarity = useCallback((a: number[], b: number[]): number => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  }, []);

  // Render
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || filtered.length === 0)
      return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

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

    // Clear canvas (transparent to show container background with texture)
    ctx.clearRect(0, 0, width, height);

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

      let color = dot;
      let opacity = baseOpacity;

      if (article.id === selectedArticle?.id) {
        color = dotSelected;
        opacity = 1;
      } else if (article.id === hoveredArticle?.id) {
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
    selectedArticle,
    searchQuery,
    similarity,
  ]);

  // Zoom setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;

    const zoomBehavior = d3Zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        setTransform({
          k: event.transform.k,
          x: event.transform.x,
          y: event.transform.y,
        });
      });

    const selection = select(canvas);
    selection.call(zoomBehavior as any);

    // Prevent default scroll behavior
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      selection.on(".zoom", null);
      canvas.removeEventListener("wheel", preventScroll);
    };
  }, [filtered]);

  // Mouse hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !containerRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - transform.x) / transform.k;
      const y = (e.clientY - rect.top - transform.y) / transform.k;

      const width = rect.width;
      const height = rect.height;
      const xScale = scaleLinear().domain([0, 1000]).range([0, width]);
      const yScale = scaleLinear().domain([0, 1000]).range([0, height]);

      let closest: Article | null = null;
      let minDist = 12;

      filtered.forEach((article) => {
        const dx = xScale(article.x) - x;
        const dy = yScale(article.y) - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = article;
        }
      });

      setHoveredArticle(closest);
    },
    [filtered, transform]
  );

  // Click to navigate
  const handleClick = useCallback(() => {
    if (hoveredArticle) {
      window.location.href = `/posts/${hoveredArticle.postSlug}`;
    }
  }, [hoveredArticle]);

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
      className={`relative ${className} bg-white dark:bg-[#1a1b26]`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Search */}
      <div className="absolute top-4 left-4 z-20">
        <input
          type="text"
          placeholder="search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-40 px-2 py-1 text-xs bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded focus:outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="cursor-pointer w-full h-full block"
        style={{ background: "transparent" }}
      />

      {/* Article Detail on Hover */}
      {hoveredArticle && (
        <div className="absolute top-4 right-4 z-20 bg-white/95 dark:bg-gray-900/95 p-3 rounded border border-gray-300 dark:border-gray-700 shadow-sm max-w-xs">
          <h3 className="font-semibold text-sm leading-tight mb-2">
            {hoveredArticle.postTitle}
          </h3>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
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
                    className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-xs text-gray-500">
        scroll to zoom • drag to pan • click to read
      </div>
    </div>
  );
}
