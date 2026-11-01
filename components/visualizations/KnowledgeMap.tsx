"use client";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<ArticleNode[]>([]);
  const [edgesUrl, setEdgesUrl] = useState<string | null>(null);
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
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  const { theme } = useTheme();
  const zoomBehaviorRef = useRef<ZoomBehavior<Element, unknown> | null>(null);
  const labelBoxesRef = useRef<PlacedLabel[]>([]);
  const zoomToClusterRef = useRef<(id: number, immediate?: boolean) => void>(
    () => {}
  );

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

  const filtered = useMemo(
    () =>
      selectedCluster === null
        ? articles
        : articles.filter((article) => article.cluster === selectedCluster),
    [articles, selectedCluster]
  );

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
      const palette = isDark ? CLUSTER_COLORS_DARK : CLUSTER_COLORS_LIGHT;
      return palette[(clusterStats.slots.get(cluster) ?? 0) % palette.length];
    },
    [clusterStats]
  );

  // Pan/zoom write here and redraw on the next frame; React state is only
  // updated when a gesture ends, so dragging never re-renders the tree.
  const transformRef = useRef(transform);
  const hoveredArticleNodeRef = useRef(hoveredArticleNode);
  const filteredRef = useRef(filtered);
  const drawRef = useRef<() => void>(() => {});
  const frameRef = useRef(0);
  const scheduleDraw = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      drawRef.current();
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);
  const labelCacheRef = useRef<{
    key: string;
    filtered: ArticleNode[];
    labels: Record<number, string>;
    layoutK: number;
    boxes: (PlacedLabel & { font: number })[];
  } | null>(null);
  useEffect(() => {
    hoveredArticleNodeRef.current = hoveredArticleNode;
  }, [hoveredArticleNode]);
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  const cancelZoomRef = useRef<() => void>(() => {});
  const animateTo = useCallback((target: ZoomState, immediate = false) => {
    const canvas = canvasRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!canvas || !behavior) return;
    cancelZoomRef.current();
    cancelZoomRef.current = animateZoom(
      transformRef.current,
      target,
      ({ k, x, y }) =>
        behavior.transform(
          select<Element, unknown>(canvas),
          zoomIdentity.translate(x, y).scale(k)
        ),
      {
        reducedMotion:
          immediate || prefersReducedMotion(window.matchMedia.bind(window)),
      }
    );
  }, []);

  useEffect(() => {
    zoomToClusterRef.current = (id: number, immediate = false) => {
      const members = clusterStats.byCluster.get(id);
      const container = containerRef.current;
      if (!members || !container) return;
      const r = container.getBoundingClientRect();
      animateTo(
        fitCluster(members, { width: r.width, height: r.height }),
        immediate
      );
    };
  }, [clusterStats, animateTo]);

  useEffect(() => () => cancelZoomRef.current(), []);

  // Render
  useEffect(() => {
    drawRef.current = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const transform = transformRef.current;

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

      const dotMuted = readToken(
        isDark ? "--color-chalk-muted" : "--color-ink-muted"
      );
      const dotHover = readToken(
        isDark ? "--color-chalk-strong" : "--color-ink-strong"
      );
      const edgeColor = readToken(
        isDark ? "--color-chalk" : "--color-ink-muted"
      );
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

        let color = isNoise
          ? dotMuted
          : getClusterColor(article.cluster, isDark);

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

      // Cluster labels, drawn in screen space after the dots. Layout ignores
      // panning and is only redone when zoom crosses a quarter-octave step, so
      // labels glide with the dots instead of re-solving every frame.
      const k = transform.k;
      const layoutK = 2 ** (Math.round(Math.log2(k) * 4) / 4);
      const compact = width < 480;
      const cacheKey = `${layoutK}|${width}|${height}|${active ?? ""}`;
      const cache = labelCacheRef.current;
      let boxes: (PlacedLabel & { font: number })[];
      if (
        cache &&
        cache.key === cacheKey &&
        cache.filtered === filtered &&
        cache.labels === clusterLabels
      ) {
        boxes = cache.boxes;
      } else {
        const fontFamily = getComputedStyle(container).fontFamily;
        const toLayout = (p: { x: number; y: number }) => ({
          x: xScale(p.x) * layoutK,
          y: yScale(p.y) * layoutK,
        });
        const density = buildDensityGrid(filtered.map(toLayout));
        const counts = new Map<number, number>();
        filtered.forEach((a) =>
          counts.set(a.cluster, (counts.get(a.cluster) ?? 0) + 1)
        );
        // the biggest groups first; more names appear as you zoom in
        const limit = Math.round((compact ? 5 : 8) * layoutK);
        const ranked = Array.from(counts)
          .filter(
            ([id]) =>
              id !== -1 && clusterLabels[id] && clusterStats.medoids.has(id)
          )
          .sort((a, b) => b[1] - a[1]);
        const shown = ranked
          .slice(0, limit)
          .concat(ranked.filter(([id], i) => i >= limit && id === active));
        const font = compact ? 11 : 12;
        ctx.font = `500 ${font}px ${fontFamily}`;
        const requests = shown.map(([id, count]) => {
          const at = toLayout(clusterStats.medoids.get(id)!);
          return {
            id,
            x: at.x,
            y: at.y,
            w: ctx.measureText(clusterLabels[id]).width + 4,
            h: font + 6,
            weight: count,
          };
        });
        boxes = placeLabels(requests, density, null).map((b) => ({
          ...b,
          font,
        }));
        labelCacheRef.current = {
          key: cacheKey,
          filtered,
          labels: clusterLabels,
          layoutK,
          boxes,
        };
      }

      // scale the cached layout to the live zoom, then add the pan offset
      const s = k / layoutK;
      const fontFamily = getComputedStyle(container).fontFamily;
      const visible: PlacedLabel[] = [];
      for (const b of boxes) {
        const w = b.x2 - b.x1;
        const h = b.y2 - b.y1;
        const cx = ((b.x1 + b.x2) / 2) * s + transform.x;
        const cy = ((b.y1 + b.y2) / 2) * s + transform.y;
        // hide labels whose cluster is off screen; otherwise slide them fully
        // inside the frame (continuous in pan, so nothing jumps)
        if (cx < 0 || cx > width || cy < 0 || cy > height) continue;
        const x1 = Math.min(Math.max(cx - w / 2, 4), width - w - 4);
        const y1 = Math.min(Math.max(cy - h / 2, 4), height - h - 4);
        const box = { id: b.id, x1, y1, x2: x1 + w, y2: y1 + h };
        const midY = y1 + h / 2;
        visible.push(box);
        ctx.globalAlpha = active === null || active === b.id ? 1 : 0.25;
        ctx.font = `500 ${b.font}px ${fontFamily}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        // a thin page-colored outline keeps text legible over dots, no boxes
        ctx.lineJoin = "round";
        ctx.lineWidth = 3;
        ctx.strokeStyle = haloColor;
        ctx.strokeText(clusterLabels[b.id], box.x1 + 2, midY + 0.5);
        ctx.fillStyle = labelColor;
        ctx.fillText(clusterLabels[b.id], box.x1 + 2, midY + 0.5);
      }
      labelBoxesRef.current = visible;
      ctx.globalAlpha = 1;
    };
    drawRef.current();
  }, [
    filtered,
    theme,
    hoveredArticleNode,
    selectedArticleNode,
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
    setPlotSize({ width: rect.width, height: rect.height });
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const zoomBehavior = d3Zoom()
      .scaleExtent([0.5, 10])
      .filter((event) => {
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;
        if (event.type === "touchstart") return event.touches.length > 1;
        return !event.button;
      })
      .on("zoom", (event) => {
        const { k, x, y } = event.transform;
        transformRef.current = { k, x, y };
        scheduleDraw();
      })
      .on("end", () => setTransform({ ...transformRef.current }));

    zoomBehaviorRef.current = zoomBehavior;
    const selection = select<Element, unknown>(canvas);
    selection.call(zoomBehavior);
    setCanvasVersion((v) => v + 1);

    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      setPlotSize({ width: newRect.width, height: newRect.height });
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

    const handleMouseLeave = () => {
      setHoveredCluster(null);
      setHoveredArticleNode(null);
    };

    const handleClick = (e: MouseEvent) => {
      const label = labelAt(e.clientX, e.clientY);
      if (label !== null) {
        zoomToClusterRef.current(label);
        return;
      }
      const closest = hitTest(e.clientX, e.clientY);

      if (!closest) {
        setSelectedArticleNode(null);
        return;
      }

      setShowTopics(false);
      setSelectedArticleNode(closest);
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
  }, [articles.length, scheduleDraw]);

  const topics = Object.entries(clusterLabels)
    .map(([id, label]) => ({
      id: Number(id),
      label,
      count: clusterStats.byCluster.get(Number(id))?.length ?? 0,
    }))
    .filter((topic) => topic.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  const resetMap = () => {
    setSelectedCluster(null);
    setSelectedArticleNode(null);
    setHoveredArticleNode(null);
    animateTo({ k: 1, x: 0, y: 0 }, true);
  };

  const changeZoom = (factor: number) => {
    const plot = containerRef.current;
    if (!plot) return;
    const current = transformRef.current;
    const k = Math.max(0.5, Math.min(10, current.k * factor));
    const ratio = k / current.k;
    animateTo(
      {
        k,
        x: plot.clientWidth / 2 - (plot.clientWidth / 2 - current.x) * ratio,
        y: plot.clientHeight / 2 - (plot.clientHeight / 2 - current.y) * ratio,
      },
      true
    );
  };

  const isFiltered = selectedCluster !== null;
  const isMoved =
    Math.abs(transform.k - 1) > 0.01 ||
    Math.abs(transform.x) > 1 ||
    Math.abs(transform.y) > 1;
  const control =
    "inline-flex size-8 items-center justify-center text-accent hover:bg-accent/10 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent";

  // Closest entries by similarity, one per post; a post can have several nodes.
  const selectedConnections = useMemo(() => {
    if (!selectedArticleNode) return [];
    const byId = new Map(articles.map((a) => [a.id, a]));
    const seen = new Set([selectedArticleNode.postSlug]);
    const closest: ArticleNode[] = [];
    const neighbors = [...(neighborsById.get(selectedArticleNode.id) ?? [])];
    for (const { id } of neighbors.sort((a, b) => b.sim - a.sim)) {
      const article = byId.get(id);
      if (!article || seen.has(article.postSlug)) continue;
      seen.add(article.postSlug);
      closest.push(article);
      if (closest.length === 3) break;
    }
    return closest;
  }, [selectedArticleNode, neighborsById, articles]);

  const previewWidth = Math.min(248, Math.max(0, plotSize.width - 24));
  const previewHeight = 200;
  const selectedPosition = selectedArticleNode
    ? {
        left: Math.max(
          12,
          Math.min(
            transform.x +
              (selectedArticleNode.x / 1000) * plotSize.width * transform.k +
              12,
            plotSize.width - previewWidth - 12
          )
        ),
        top: Math.max(
          12,
          Math.min(
            transform.y +
              (selectedArticleNode.y / 1000) * plotSize.height * transform.k -
              40,
            plotSize.height - previewHeight - 12
          )
        ),
        width: previewWidth,
      }
    : undefined;

  if (loading) return <UMAPLoader className={`h-96 ${className}`} />;
  if (error)
    return (
      <p className="py-8 text-sm text-muted">couldn&apos;t load connections.</p>
    );

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted">
          {isFiltered ? `${filtered.length.toLocaleString("en-US")} of ` : ""}
          {articles.length.toLocaleString("en-US")} entries
        </p>
        <div className="flex items-center gap-1">
          {(isFiltered || isMoved) && (
            <button
              onClick={resetMap}
              className="mr-2 text-xs text-accent underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent"
            >
              show all
            </button>
          )}
          <button
            aria-label="Zoom out"
            onClick={() => changeZoom(1 / 1.5)}
            disabled={transform.k <= 0.5}
            className={control}
          >
            −
          </button>
          <button
            aria-label="Zoom in"
            onClick={() => changeZoom(1.5)}
            disabled={transform.k >= 10}
            className={control}
          >
            +
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative mt-2 h-[22rem] w-full border border-accent/35 sm:h-[28rem]"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`${filtered.length} entries arranged by topic`}
          className="block h-full w-full"
          style={{ background: "transparent" }}
        />
        <div className="absolute bottom-3 right-3 z-10">
          <button
            aria-expanded={showTopics}
            aria-controls="map-clusters"
            onClick={() => {
              setSelectedArticleNode(null);
              setShowTopics((open) => !open);
            }}
            className="max-w-48 truncate border border-accent/25 bg-surface/95 px-3 py-1.5 text-xs text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            {showTopics ? "close clusters" : "clusters"}
          </button>
          {showTopics && (
            <div
              id="map-clusters"
              className="absolute bottom-10 right-0 max-h-60 w-60 max-w-[75vw] overflow-y-auto overscroll-contain border border-accent/35 bg-surface p-2 shadow-sm"
            >
              <button
                onClick={resetMap}
                className="w-full px-2 py-2 text-left text-xs text-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent"
              >
                show all entries
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  aria-pressed={selectedCluster === topic.id}
                  onClick={() => {
                    const id = selectedCluster === topic.id ? null : topic.id;
                    setSelectedCluster(id);
                    setSelectedArticleNode(null);
                    setHoveredArticleNode(null);
                    if (id === null) animateTo({ k: 1, x: 0, y: 0 }, true);
                    else zoomToClusterRef.current(id, true);
                  }}
                  onMouseEnter={() => setHoveredCluster(topic.id)}
                  onMouseLeave={() => setHoveredCluster(null)}
                  onFocus={() => setHoveredCluster(topic.id)}
                  onBlur={() => setHoveredCluster(null)}
                  className={`flex w-full items-baseline justify-between gap-3 px-2 py-2 text-left text-xs text-primary hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent ${selectedCluster === topic.id ? "bg-accent/10 font-bold" : ""}`}
                >
                  <span>{topic.label}</span>
                  <span className="text-muted tabular-nums">{topic.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {filtered.length === 0 && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            no entries in this cluster.
          </p>
        )}
        {hoveredArticleNode && !selectedArticleNode && (
          <div className="pointer-events-none absolute top-3 right-3 max-w-[75%] border border-accent/25 bg-surface/95 px-3 py-2 text-xs text-primary">
            {hoveredArticleNode.postTitle}
          </div>
        )}
        {selectedArticleNode && (
          <article
            aria-live="polite"
            style={selectedPosition}
            className="absolute z-10 border border-accent/35 bg-surface px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm text-primary">
                  <Link
                    href={`/posts/${encodeURIComponent(selectedArticleNode.postSlug)}`}
                    className="line-clamp-2 hover:underline underline-offset-4"
                  >
                    {selectedArticleNode.postTitle} →
                  </Link>
                </h3>
                {selectedArticleNode.publishedDate && (
                  <p className="mt-1 text-xs text-muted">
                    {new Date(
                      selectedArticleNode.publishedDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </p>
                )}
                {clusterLabels[selectedArticleNode.cluster] && (
                  <p className="mt-1 text-xs text-muted">
                    in {clusterLabels[selectedArticleNode.cluster]}
                  </p>
                )}
              </div>
              <button
                aria-label="Close entry preview"
                onClick={() => setSelectedArticleNode(null)}
                className="-m-1 shrink-0 p-1 text-sm text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                ×
              </button>
            </div>
            {selectedConnections.length > 0 && (
              <div className="mt-3">
                <p className="text-2xs uppercase tracking-[0.12em] text-muted">
                  closest entries
                </p>
                <ul className="mt-1.5 space-y-1 text-xs">
                  {selectedConnections.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/posts/${encodeURIComponent(article.postSlug)}`}
                        className="line-clamp-1 text-accent hover:underline underline-offset-4"
                      >
                        {article.postTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
