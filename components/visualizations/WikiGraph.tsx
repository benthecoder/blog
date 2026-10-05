"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import type { WikiGraphData, WikiGraphNode } from "@/utils/content/wikiGraph";

type SimNode = WikiGraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
};
type SimEdge = { source: SimNode; target: SimNode; kind: "contain" | "ref" };

const isDomain = (n: SimNode) => n.kind === "domain";
const radius = (n: SimNode) => (isDomain(n) ? 7 : 4.5);

export default function WikiGraph({
  data,
  className = "",
}: {
  data: WikiGraphData;
  className?: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const [, tick] = useReducer((n) => n + 1, 0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const draggingRef = useRef<{ node: SimNode; moved: boolean } | null>(null);

  // Build simulation nodes/edges exactly once — the simulation mutates these
  // objects in place, so they must keep a stable identity across re-renders.
  const graphRef = useRef<{ nodes: SimNode[]; edges: SimEdge[] } | null>(null);
  if (!graphRef.current) {
    const nodeById = new Map<string, SimNode>(
      data.nodes.map((n) => [n.id, { ...n, x: 0, y: 0, vx: 0, vy: 0 }])
    );
    const simEdges: SimEdge[] = data.edges.flatMap((e) => {
      const source = nodeById.get(e.source);
      const target = nodeById.get(e.target);
      return source && target ? [{ source, target, kind: e.kind }] : [];
    });
    graphRef.current = { nodes: [...nodeById.values()], edges: simEdges };
  }
  const { nodes, edges } = graphRef.current;

  // Track container size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Run the force simulation. Domains repel harder and pull toward center so
  // topics settle in orbit around their hub.
  useEffect(() => {
    if (!size.w || !size.h || nodes.length === 0) return;

    // Seed a spread around center so coincident points don't collapse the layout.
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const spread = Math.min(size.w, size.h) * 0.25;
      n.x = size.w / 2 + Math.cos(angle) * spread * (0.5 + Math.random() * 0.5);
      n.y = size.h / 2 + Math.sin(angle) * spread * (0.5 + Math.random() * 0.5);
      n.vx = 0;
      n.vy = 0;
    });

    const sim = forceSimulation<SimNode>(nodes)
      .force(
        "link",
        forceLink<SimNode, SimEdge>(edges)
          .id((d) => d.id)
          .distance((e) => (e.kind === "contain" ? 46 : 70))
          .strength((e) => (e.kind === "contain" ? 0.7 : 0.25))
      )
      .force(
        "charge",
        forceManyBody<SimNode>().strength((n) => (isDomain(n) ? -420 : -140))
      )
      .force("center", forceCenter(size.w / 2, size.h / 2))
      .force("x", forceX(size.w / 2).strength(0.04))
      .force("y", forceY(size.h / 2).strength(0.04))
      .force(
        "collide",
        forceCollide<SimNode>((n) => radius(n) + 14)
      )
      .on("tick", tick);

    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [nodes, edges, size.w, size.h]);

  // Pointer-based node dragging: pin to the cursor while held, release to
  // physics on drop. A drag that barely moves counts as a click → navigate.
  const toLocal = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const { x, y } = toLocal(e.clientX, e.clientY);
      drag.node.fx = x;
      drag.node.fy = y;
      drag.moved = true;
      simRef.current?.alphaTarget(0.3).restart();
    };
    const onUp = () => {
      const drag = draggingRef.current;
      if (!drag) return;
      drag.node.fx = null;
      drag.node.fy = null;
      simRef.current?.alphaTarget(0);
      if (!drag.moved && drag.node.slug) {
        router.push(`/wiki/${drag.node.slug}`);
      }
      draggingRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [router]);

  const neighbors = useMemo(() => {
    if (!hovered) return null;
    const set = new Set<string>([hovered]);
    for (const e of edges) {
      if (e.source.id === hovered) set.add(e.target.id);
      if (e.target.id === hovered) set.add(e.source.id);
    }
    return set;
  }, [hovered, edges]);

  const dim = (id: string) => neighbors !== null && !neighbors.has(id);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block touch-none select-none"
      >
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.source.x}
            y1={e.source.y}
            x2={e.target.x}
            y2={e.target.y}
            stroke="currentColor"
            strokeWidth={e.kind === "ref" ? 1 : 0.8}
            strokeDasharray={e.kind === "ref" ? "3 3" : undefined}
            className="text-ink-muted dark:text-chalk-muted transition-opacity"
            style={{
              strokeOpacity:
                neighbors &&
                !(neighbors.has(e.source.id) && neighbors.has(e.target.id))
                  ? 0.06
                  : 0.28,
            }}
          />
        ))}

        {nodes.map((n) => {
          const r = radius(n);
          const active = hovered === n.id;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              className="cursor-pointer"
              style={{ opacity: dim(n.id) ? 0.3 : 1 }}
              onPointerDown={(ev) => {
                ev.preventDefault();
                draggingRef.current = { node: n, moved: false };
                simRef.current?.alphaTarget(0.3).restart();
              }}
              onPointerEnter={() => setHovered(n.id)}
              onPointerLeave={() => setHovered((h) => (h === n.id ? null : h))}
            >
              <circle
                r={active ? r + 1.5 : r}
                fill="currentColor"
                className={
                  isDomain(n)
                    ? "text-ink-strong dark:text-chalk-strong"
                    : "text-ink-muted dark:text-chalk-muted"
                }
              />
              <text
                x={0}
                y={r + 13}
                textAnchor="middle"
                fill="currentColor"
                className={
                  isDomain(n)
                    ? "text-ink-strong dark:text-chalk-strong"
                    : "text-ink-soft dark:text-chalk-muted"
                }
                style={{
                  fontSize: isDomain(n) ? 12 : 11,
                  fontWeight: isDomain(n) ? 600 : 400,
                  pointerEvents: "none",
                }}
              >
                {n.label.toLowerCase()}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="pointer-events-none absolute bottom-2 left-2 text-[10px] text-ink-muted/60 dark:text-chalk-muted/60">
        drag to rearrange · click a topic to open
      </p>
    </div>
  );
}
