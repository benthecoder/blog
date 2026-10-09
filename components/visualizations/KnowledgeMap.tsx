"use client";

import { useRouter } from "next/navigation";
import { findNearestMapNode } from "@/utils/chunking/mapHitTest";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { scaleLinear } from "d3-scale";
import { zoom as d3Zoom, zoomIdentity, ZoomBehavior } from "d3-zoom";
import { select } from "d3-selection";
import type {
  ArticleNode,
  KnowledgeMapPreview,
  SimilarityEdge,
} from "@/types/knowledgeMap";
import {
  buildDensityGrid,
  fitCluster,
  placeLabels,
  type PlacedLabel,
} from "@/utils/chunking/mapLabels";
import {
  CLUSTER_COLORS_DARK,
  CLUSTER_COLORS_LIGHT,
  assignClusterColors,
  medoid,
  type ClusterAnchor,
} from "@/utils/chunking/mapPalette";
import {
  animateZoom,
  prefersReducedMotion,
  type ZoomState,
} from "@/utils/chunking/mapZoom";
import UMAPLoader from "./UMAPLoader";

const NOISE_COLOR_LIGHT = "#a3a19b";
const NOISE_COLOR_DARK = "#707070";

// Canvas can't use CSS classes, so palette colors are read off the document
// element — which is where the [data-palette] custom properties resolve.
function readToken(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export default function KnowledgeMap({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<ArticleNode[]>([]);
  const [edgesUrl, setEdgesUrl] = useState<string | null>(null);
  const [summariesUrl, setSummariesUrl] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string> | null>(
    null
  );
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);
  const [neighborsById, setNeighborsById] = useState<
    Map<string, { id: string; sim: number }[]>
  >(new Map());
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
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { theme } = useTheme();
  const zoomBehaviorRef = useRef<ZoomBehavior<Element, unknown> | null>(null);
  const selectedArticleNodeRef = useRef<ArticleNode | null>(null);
  const labelBoxesRef = useRef<PlacedLabel[]>([]);
  const zoomToClusterRef = useRef<(id: number) => void>(() => {});

  // matchMedia is client-only; reading it in an initializer would run
  // during SSR/hydration and mismatch.
  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    selectedArticleNodeRef.current = selectedArticleNode;
  }, [selectedArticleNode]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/data/knowledge-map-nodes.json", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Map unavailable");
        const result: KnowledgeMapPreview = await response.json();
        if (controller.signal.aborted) return;
        if (!result.success) throw new Error("Map unavailable");
        setArticles(result.data);
        setEdgesUrl(result.similarityEdgesUrl);
        setSummariesUrl(result.summariesUrl ?? null);
        setClusterLabels(result.clusterLabels || {});
      } catch {
        if (!controller.signal.aborted) setError("error loading data");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const hasFocusedNode = Boolean(selectedArticleNode ?? hoveredArticleNode);
  useEffect(() => {
    if (!hasFocusedNode || !edgesUrl || connectionsLoaded) return;
    const controller = new AbortController();
    async function loadConnections() {
      try {
        const response = await fetch(edgesUrl!, { signal: controller.signal });
        if (!response.ok) throw new Error("Connections unavailable");
        const edges: SimilarityEdge[] = await response.json();
        if (controller.signal.aborted) return;
        const neighbors = new Map<string, { id: string; sim: number }[]>();
        for (const [i, j, sim] of edges) {
          const a = articles[i]?.id;
          const b = articles[j]?.id;
          if (!a || !b) continue;
          if (!neighbors.has(a)) neighbors.set(a, []);
          if (!neighbors.has(b)) neighbors.set(b, []);
          neighbors.get(a)!.push({ id: b, sim });
          neighbors.get(b)!.push({ id: a, sim });
        }
        setNeighborsById(neighbors);
        setConnectionsLoaded(true);
      } catch {
        // Nodes remain usable. A later hover/selection retries connections.
      }
    }
    void loadConnections();
    return () => controller.abort();
  }, [hasFocusedNode, edgesUrl, connectionsLoaded, articles]);

  // One-line summaries load on the first hover, not with the landing payload
  useEffect(() => {
    if (!hasFocusedNode || !summariesUrl || summaries) return;
    const controller = new AbortController();
    fetch(summariesUrl, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("summaries"))))
      .then((data: Record<string, string>) => setSummaries(data))
      .catch(() => {
        // the card works without summaries; a later hover retries
      });
    return () => controller.abort();
  }, [hasFocusedNode, summariesUrl, summaries]);

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

  const clusterStats = useMemo(() => {
    const byCluster = new Map<number, ArticleNode[]>();
    for (const a of articles) {
      const list = byCluster.get(a.cluster);
      if (list) list.push(a);
      else byCluster.set(a.cluster, [a]);
    }
    const anchors: ClusterAnchor[] = [];
    const medoids = new Map<number, { x: number; y: number }>();
    byCluster.forEach((members, id) => {
      if (id === -1) return;
      const m = medoid(members);
      medoids.set(id, m);
      anchors.push({ id, x: m.x, y: m.y, count: members.length });
    });
    const slots = assignClusterColors(anchors, CLUSTER_COLORS_LIGHT.length);
    return { byCluster, medoids, slots };
  }, [articles]);

  // Stable identity required: dep of the canvas render effect below
  const getClusterColor = useCallback(
    (cluster: number, isDark: boolean): string => {
      if (cluster === -1) return isDark ? NOISE_COLOR_DARK : NOISE_COLOR_LIGHT;
      const palette = isDark ? CLUSTER_COLORS_DARK : CLUSTER_COLORS_LIGHT;
      return palette[(clusterStats.slots.get(cluster) ?? 0) % palette.length];
    },
    [clusterStats]
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

  const cancelZoomRef = useRef<() => void>(() => {});
  const animateTo = useCallback((target: ZoomState) => {
    const canvas = canvasRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!canvas || !behavior) return;
    cancelZoomRef.current();
    cancelZoomRef.current = animateZoom(
      transformRef.current,
      target,
      ({ k, x, y }) =>
        select<Element, unknown>(canvas).call(
          behavior.transform,
          zoomIdentity.translate(x, y).scale(k)
        ),
      {
        reducedMotion: prefersReducedMotion(window.matchMedia.bind(window)),
      }
    );
  }, []);

  useEffect(() => {
    zoomToClusterRef.current = (id: number) => {
      const members = clusterStats.byCluster.get(id);
      const container = containerRef.current;
      if (!members || !container) return;
      const r = container.getBoundingClientRect();
      animateTo(fitCluster(members, { width: r.width, height: r.height }));
    };
  }, [clusterStats, animateTo]);

  useEffect(() => () => cancelZoomRef.current(), []);

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

    const dotDefault = readToken(isDark ? "--color-chalk" : "--color-ink");
    const dotHover = readToken(
      isDark ? "--color-chalk-strong" : "--color-ink-strong"
    );
    const edgeColor = readToken(isDark ? "--color-chalk" : "--color-ink-muted");
    const labelColor = readToken(
      isDark ? "--color-chalk-strong" : "--color-ink-strong"
    );
    const haloColor = readToken(isDark ? "--color-night" : "--color-paper");

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Similarity connections on hover/select — opacity scales with similarity
    const focusedArticleNode = selectedArticleNode ?? hoveredArticleNode;
    if (focusedArticleNode) {
      const byId = new Map(filtered.map((a) => [a.id, a]));
      (neighborsById.get(focusedArticleNode.id) ?? []).forEach(
        ({ id, sim }) => {
          const other = byId.get(id);
          if (!other) return;
          const alpha = Math.max(0.06, (sim - 0.7) * 0.5);
          ctx.beginPath();
          ctx.moveTo(
            xScale(focusedArticleNode.x),
            yScale(focusedArticleNode.y)
          );
          ctx.lineTo(xScale(other.x), yScale(other.y));
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = edgeColor;
          ctx.lineWidth = 0.8 / transform.k;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      );
    }

    // Dots — circles only; unclustered posts sit underneath, small and quiet
    const active = hoveredCluster;
    const drawDot = (article: ArticleNode) => {
      const x = xScale(article.x);
      const y = yScale(article.y);
      const wordCount = article.wordCount;
      const isNoise = article.cluster === -1;
      let size = isNoise
        ? 1.6
        : Math.max(2, Math.min(3.5, Math.log(wordCount + 1) * 0.55));
      let opacity = isNoise ? 0.55 : Math.min(0.78, 0.45 + wordCount / 2500);

      const isSelected = article.id === selectedArticleNode?.id;
      const isHovered = article.id === hoveredArticleNode?.id;

      let color = getClusterColor(article.cluster, isDark);

      if (active !== null) {
        if (article.cluster === active) {
          opacity = 0.95;
          size += 0.6;
        } else {
          opacity *= 0.15;
        }
      }

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
      ctx.arc(x, y, size / Math.sqrt(transform.k), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };
    filtered.forEach((a) => a.cluster === -1 && drawDot(a));
    filtered.forEach((a) => a.cluster !== -1 && drawDot(a));
    ctx.globalAlpha = 1;

    ctx.restore();

    // Cluster labels, in screen space after the dots so nothing paints over
    // them. Each sits at its cluster's medoid, nudged to the sparsest nearby
    // spot, on a paper-colored pill.
    const fontFamily = getComputedStyle(container).fontFamily;
    const k = transform.k;
    const toScreen = (p: { x: number; y: number }) => ({
      x: xScale(p.x) * k + transform.x,
      y: yScale(p.y) * k + transform.y,
    });
    const density = buildDensityGrid(filtered.map(toScreen));
    const counts = new Map<number, number>();
    filtered.forEach((a) =>
      counts.set(a.cluster, (counts.get(a.cluster) ?? 0) + 1)
    );

    const compact = width < 480;
    const fontFor = (count: number) =>
      (count >= 25 ? 11 : count >= 12 ? 10 : 9) * (compact ? 0.85 : 1);
    const padX = 6;
    const dotGap = 12; // room for the cluster color dot
    const requests = Array.from(counts)
      .filter(([id, count]) => {
        if (id === -1 || !clusterLabels[id] || !clusterStats.medoids.has(id))
          return false;
        // tiny clusters only earn a label once zoomed in
        return id === active || count * Math.sqrt(k) >= (compact ? 18 : 10);
      })
      .map(([id, count]) => {
        ctx.font = `500 ${fontFor(count)}px ${fontFamily}`;
        const at = toScreen(clusterStats.medoids.get(id)!);
        return {
          id,
          x: at.x,
          y: at.y,
          w: ctx.measureText(clusterLabels[id]).width + padX * 2 + dotGap,
          h: fontFor(count) + 8,
          weight: count,
        };
      })
      .filter(
        (r) =>
          r.x > -r.w && r.x < width + r.w && r.y > -r.h && r.y < height + r.h
      );
    // keep clear of the search box and reset button
    const placed = placeLabels(
      requests,
      density,
      { width, height },
      { reserved: [{ x1: 0, y1: 0, x2: 230, y2: 48 }] }
    );
    labelBoxesRef.current = placed;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    placed.forEach((box) => {
      const count = counts.get(box.id) ?? 0;
      const font = fontFor(count);
      const h = box.y2 - box.y1;
      ctx.globalAlpha = active === null || active === box.id ? 1 : 0.3;
      ctx.fillStyle = haloColor;
      ctx.beginPath();
      if (ctx.roundRect)
        ctx.roundRect(box.x1, box.y1, box.x2 - box.x1, h, h / 2);
      else ctx.rect(box.x1, box.y1, box.x2 - box.x1, h);
      ctx.globalAlpha *= 0.88;
      ctx.fill();
      ctx.globalAlpha = active === null || active === box.id ? 1 : 0.3;
      ctx.fillStyle = getClusterColor(box.id, isDark);
      ctx.beginPath();
      ctx.arc(box.x1 + padX + 2, box.y1 + h / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `500 ${font}px ${fontFamily}`;
      ctx.fillStyle = labelColor;
      ctx.fillText(
        clusterLabels[box.id],
        box.x1 + padX + dotGap - 2,
        box.y1 + h / 2 + 0.5
      );
    });
    ctx.globalAlpha = 1;
  }, [
    filtered,
    theme,
    transform,
    hoveredArticleNode,
    selectedArticleNode,
    searchQuery,
    neighborsById,
    getClusterColor,
    clusterLabels,
    clusterStats,
    hoveredCluster,
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

      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      return findNearestMapNode(
        filteredRef.current,
        { x, y },
        { width: r.width, height: r.height },
        isTouch ? 24 : 12
      );
    }

    function labelAt(clientX: number, clientY: number): number | null {
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      const hit = labelBoxesRef.current.find(
        (b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
      );
      return hit ? hit.id : null;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const label = labelAt(e.clientX, e.clientY);
      if (label !== null) {
        canvas.style.cursor = "pointer";
        setHoveredArticleNode(null);
        setHoveredCluster(label);
        return;
      }
      setHoveredCluster(null);
      const closest = hitTest(e.clientX, e.clientY);
      canvas.style.cursor = closest ? "pointer" : "crosshair";
      setHoveredArticleNode(closest);
    };

    const handleMouseLeave = () => setHoveredCluster(null);

    const handleClick = (e: MouseEvent) => {
      const label = labelAt(e.clientX, e.clientY);
      if (label !== null) {
        zoomToClusterRef.current(label);
        return;
      }
      const closest = hitTest(e.clientX, e.clientY);

      if (!closest) {
        setSelectedArticleNode(null);
        setClickPos(null);
        return;
      }

      if (selectedArticleNodeRef.current?.id === closest.id) {
        router.push(`/posts/${encodeURIComponent(closest.postSlug)}`);
      } else {
        const cr = containerRef.current!.getBoundingClientRect();
        setClickPos({ x: e.clientX - cr.left, y: e.clientY - cr.top });
        setSelectedArticleNode(closest);
      }
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);
    // a user gesture interrupts any running zoom animation
    const stopAnimation = () => cancelZoomRef.current();
    canvas.addEventListener("wheel", stopAnimation, { passive: true });
    canvas.addEventListener("pointerdown", stopAnimation, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      selection.on(".zoom", null);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("wheel", stopAnimation);
      canvas.removeEventListener("pointerdown", stopAnimation);
    };
  }, [articles.length, router]);

  if (loading) return <UMAPLoader className={className} />;

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const isMoved =
    Math.abs(transform.k - 1) > 0.01 ||
    Math.abs(transform.x) > 1 ||
    Math.abs(transform.y) > 1;
  const displayArticleNode = selectedArticleNode ?? hoveredArticleNode;
  const isPinned = selectedArticleNode !== null;

  const getPanelPosition = () => {
    if (!isPinned || !clickPos || !containerRef.current)
      return { top: "1rem", right: "1rem" };
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const W = 240;
    const H = 230;
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
      className={`relative ${className} bg-paper dark:bg-night`}
    >
      {/* Search */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <input
          type="text"
          placeholder="search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-36 px-2 py-1 text-xs bg-paper/90 dark:bg-night/90 text-ink dark:text-chalk border border-rule dark:border-white/8 focus:outline-hidden placeholder:text-ink/25 dark:placeholder:text-chalk/25 backdrop-blur-xs"
        />
        {isMoved && (
          <button
            onClick={() => animateTo({ k: 1, x: 0, y: 0 })}
            className="bg-paper/90 dark:bg-night/90 px-2 py-1 border border-rule dark:border-white/8 text-xs text-ink/60 dark:text-chalk/60 hover:text-ink dark:hover:text-chalk transition-colors backdrop-blur-xs"
          >
            reset
          </button>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ background: "transparent" }}
      />

      {/* ArticleNode detail panel — hover preview or pinned detail */}
      {displayArticleNode && (
        <div
          className={`absolute z-20 bg-paper/95 dark:bg-night/95 p-3 border shadow-xs w-[200px] sm:w-56 backdrop-blur-xs transition-[border-color] duration-150 pointer-events-none ${
            isPinned
              ? "border-ink/25 dark:border-white/15"
              : "border-rule dark:border-white/8"
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
              className="pointer-events-auto absolute top-1.5 right-2 text-ink/30 hover:text-ink/70 dark:text-chalk/30 dark:hover:text-chalk/70 transition-colors text-base leading-none"
            >
              ×
            </button>
          )}

          <h3 className="font-medium text-sm leading-tight mb-2 text-ink dark:text-chalk pr-4">
            {displayArticleNode.postTitle}
          </h3>

          {summaries?.[displayArticleNode.postSlug] && (
            <p className="mb-2 text-xs leading-snug text-ink/70 dark:text-chalk/70 line-clamp-4">
              {summaries[displayArticleNode.postSlug]}
            </p>
          )}

          <div className="space-y-1 text-xs text-ink/60 dark:text-chalk/60">
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
              className="pointer-events-auto mt-3 flex items-center gap-1 text-xs text-ink/50 hover:text-ink dark:text-chalk/50 dark:hover:text-chalk transition-colors"
            >
              read →
            </Link>
          ) : (
            <p className="mt-2 text-[10px] text-ink/25 dark:text-chalk/25">
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
            className="bg-paper/90 dark:bg-night/90 px-2 py-1 border border-rule dark:border-white/8 text-xs text-ink/60 dark:text-chalk/60 hover:text-ink dark:hover:text-chalk transition-colors backdrop-blur-xs"
          >
            {showLegend
              ? "hide"
              : selectedCluster !== null
                ? `cluster: ${clusterLabels[selectedCluster] ?? "unclustered"}`
                : "clusters"}
          </button>
          {showLegend && (
            <div className="absolute bottom-8 right-0 bg-paper/95 dark:bg-night/95 px-3 py-2 border border-rule dark:border-white/8 max-h-[min(60vh,18rem)] overflow-y-auto shadow-xs min-w-[200px] backdrop-blur-xs">
              {selectedCluster !== null && (
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="w-full mb-2 px-2 py-1 text-xs bg-rule/30 dark:bg-white/6 hover:bg-rule/50 dark:hover:bg-white/10 transition-colors"
                >
                  show all clusters
                </button>
              )}
              <div className="space-y-0.5">
                {Object.entries(clusterLabels)
                  .map(([clusterId, label]) => ({
                    id: Number(clusterId),
                    label,
                    count:
                      clusterStats.byCluster.get(Number(clusterId))?.length ??
                      0,
                  }))
                  .filter((c) => c.id !== -1)
                  .sort((a, b) => b.count - a.count)
                  .concat(
                    clusterStats.byCluster.has(-1)
                      ? [
                          {
                            id: -1,
                            label: "unclustered",
                            count: clusterStats.byCluster.get(-1)!.length,
                          },
                        ]
                      : []
                  )
                  .map(({ id, label, count }) => {
                    const isActive = selectedCluster === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedCluster(isActive ? null : id)}
                        onMouseEnter={() => setHoveredCluster(id)}
                        onMouseLeave={() => setHoveredCluster(null)}
                        onFocus={() => setHoveredCluster(id)}
                        onBlur={() => setHoveredCluster(null)}
                        className={`w-full flex items-center gap-2 text-xs py-0.5 px-1 rounded transition-colors ${
                          isActive
                            ? "bg-rule/40 dark:bg-white/6"
                            : "hover:bg-rule/20 dark:hover:bg-white/4"
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
                        <span className="text-ink/70 dark:text-chalk/70 text-left">
                          {label}{" "}
                          <span className="text-ink/40 dark:text-chalk/40">
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
      <div className="absolute bottom-4 left-4 z-10 bg-paper/80 dark:bg-night/80 px-3 py-1 border border-rule dark:border-white/8 text-xs text-ink/40 dark:text-chalk/40 pointer-events-none backdrop-blur-xs">
        {isTouchDevice ? "pinch · drag · tap" : "scroll · drag · click"}
      </div>
    </div>
  );
}
