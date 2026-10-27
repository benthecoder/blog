"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type { Map3dPoint } from "@/utils/content/knowledgeMap3d";
import {
  CLUSTER_COLORS_DARK,
  CLUSTER_COLORS_LIGHT,
  assignClusterColors,
} from "@/utils/chunking/mapPalette";
import {
  CAMERA_DISTANCE,
  STRIDE,
  backToFront,
  centroids,
  clampPitch,
  clampZoom,
  depthFactor,
  nearestPoint,
  projectAll,
} from "@/utils/chunking/map3d";

const AUTO_SPEED = 0.00012; // radians per ms
const DRAG_SPEED = 0.005; // radians per px
const CLICK_SLOP = 5; // px of travel that still counts as a tap
const HIT_RADIUS = 12; // px
// Cloud radius is ~1 and perspective magnifies the near side by d/(d-1)=1.5;
// 0.92 leaves ~8% of the short side free on each edge at zoom 1.
const FIT = 0.92 / (CAMERA_DISTANCE / (CAMERA_DISTANCE - 1));
const LABEL_PAD = 4; // px between labels

interface Theme {
  muted: string;
  strong: string;
  halo: string;
  dark: boolean;
}

// Canvas can't use CSS classes, so tokens are read off the document element,
// where the theme class and [data-palette] custom properties resolve.
function readTheme(): Theme {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const token = (name: string) => style.getPropertyValue(name).trim();
  const dark = root.classList.contains("dark");
  return {
    dark,
    muted: token(dark ? "--color-chalk-muted" : "--color-ink-muted"),
    strong: token(dark ? "--color-chalk-strong" : "--color-ink-strong"),
    halo: token(dark ? "--color-night" : "--color-paper"),
  };
}

export default function KnowledgeMap3D({
  points,
  clusterLabels,
}: {
  points: Map3dPoint[];
  clusterLabels: Record<number, string>;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const requestDraw = useRef<() => void>(() => {});
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);

  const xyz = useMemo(() => {
    const flat = new Float32Array(points.length * 3);
    points.forEach((p, i) => flat.set([p.x, p.y, p.z], i * 3));
    return flat;
  }, [points]);

  const clusters = useMemo(() => {
    const groups = points.map((p) => p.cluster);
    const cents = centroids(points, groups);
    const slots = assignClusterColors(
      Array.from(cents, ([id, c]) => ({
        id,
        x: c.x,
        y: c.y,
        count: c.count,
      })).filter((c) => c.id !== -1),
      CLUSTER_COLORS_LIGHT.length
    );
    return { cents, slots };
  }, [points]);

  const byCluster = useMemo(() => {
    const groups = new Map<number, Map3dPoint[]>();
    for (const p of points) {
      const list = groups.get(p.cluster);
      if (list) list.push(p);
      else groups.set(p.cluster, [p]);
    }
    return Array.from(groups).sort((a, b) => b[1].length - a[1].length);
  }, [points]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const view = { yaw: 0.6, pitch: 0.35, zoom: 1 };
    let width = 0;
    let height = 0;
    let theme = readTheme();
    let fontFamily = getComputedStyle(canvas).fontFamily;
    let auto = !reduceMotion;
    let raf = 0;
    let last = 0;
    let dirty = true;

    const projected = new Float32Array(points.length * STRIDE);
    const order = new Uint32Array(points.length);
    const radiusOf = () => (Math.min(width, height) / 2) * FIT * view.zoom;

    const colorOf = (cluster: number) => {
      if (cluster === -1) return theme.muted;
      const palette = theme.dark ? CLUSTER_COLORS_DARK : CLUSTER_COLORS_LIGHT;
      return palette[(clusters.slots.get(cluster) ?? 0) % palette.length];
    };

    const project = () =>
      projectAll(
        xyz,
        { yaw: view.yaw, pitch: view.pitch, radius: radiusOf() },
        projected
      );

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      project();
      backToFront(projected, points.length, order);
      const cx = width / 2;
      const cy = height / 2;
      const size = Math.min(width, height) / 800 + 0.6;

      for (let k = 0; k < points.length; k++) {
        const i = order[k];
        const o = i * STRIDE;
        const t = depthFactor(projected[o + 2]);
        const isHover = i === hoveredRef.current;
        const r = (1.2 + t * 2.2) * size * (isHover ? 2.2 : 1);
        ctx.globalAlpha = isHover ? 1 : 0.25 + t * 0.7;
        ctx.fillStyle = colorOf(points[i].cluster);
        ctx.beginPath();
        ctx.arc(cx + projected[o], cy + projected[o + 1], r, 0, Math.PI * 2);
        ctx.fill();
        if (isHover) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = theme.strong;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // cluster labels at their 3D centroids, faded with depth
      const labelPx = Math.max(10, Math.min(13, width / 90));
      ctx.font = `${labelPx}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      const lp = new Float32Array(STRIDE);
      const labelView = {
        yaw: view.yaw,
        pitch: view.pitch,
        radius: radiusOf(),
      };
      const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
      const candidates: { label: string; x: number; y: number; z: number }[] =
        [];
      clusters.cents.forEach((c, id) => {
        const label = clusterLabels[id];
        if (id === -1 || !label) return;
        projectAll([c.x, c.y, c.z], labelView, lp);
        candidates.push({ label, x: cx + lp[0], y: cy + lp[1], z: lp[2] });
      });
      // nearest first, so the labels that survive collisions are the front ones
      candidates.sort((a, b) => b.z - a.z);
      for (const c of candidates) {
        const w = ctx.measureText(c.label).width;
        const half = w / 2;
        const x = Math.min(
          width - half - LABEL_PAD,
          Math.max(half + LABEL_PAD, c.x)
        );
        const box = {
          x1: x - half - LABEL_PAD,
          x2: x + half + LABEL_PAD,
          y1: c.y - labelPx / 2 - LABEL_PAD,
          y2: c.y + labelPx / 2 + LABEL_PAD,
        };
        if (
          placed.some(
            (p) =>
              box.x1 < p.x2 && box.x2 > p.x1 && box.y1 < p.y2 && box.y2 > p.y1
          )
        )
          continue;
        placed.push(box);
        ctx.globalAlpha = 0.12 + depthFactor(c.z) * 0.75;
        ctx.strokeStyle = theme.halo;
        ctx.fillStyle = theme.strong;
        ctx.strokeText(c.label, x, c.y);
        ctx.fillText(c.label, x, c.y);
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      if (auto) {
        view.yaw += AUTO_SPEED * dt;
        dirty = true;
      }
      if (dirty) {
        dirty = false;
        draw();
      }
      // idle once nothing is moving: the next event restarts the loop
      if (auto || dirty) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const schedule = () => {
      dirty = true;
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    };
    requestDraw.current = schedule;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // setting width cleared the canvas; repaint now, not next frame
      draw();
      schedule();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const refreshTheme = () => {
      theme = readTheme();
      fontFamily = getComputedStyle(canvas).fontFamily;
      schedule();
    };
    // theme class and palette attribute both change the resolved tokens
    const attrObserver = new MutationObserver(refreshTheme);
    attrObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette"],
    });

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      } else schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const stopAuto = () => {
      auto = false;
    };

    // pointers: one finger orbits, two pinch
    const active = new Map<number, { x: number; y: number }>();
    let travel = 0;
    let pinchDist = 0;

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
    };
    const hit = (x: number, y: number) =>
      nearestPoint(
        projected,
        points.length,
        x - width / 2,
        y - height / 2,
        HIT_RADIUS
      );
    const setHover = (idx: number | null, x = 0, y = 0) => {
      const tip = tooltipRef.current;
      if (tip && idx !== null) {
        tip.style.transform = `translate(${Math.min(x + 14, width - 220)}px, ${Math.max(y - 8, 8)}px)`;
      }
      if (idx === hoveredRef.current) return;
      hoveredRef.current = idx;
      setHovered(idx);
      canvas.style.cursor = idx === null ? "grab" : "pointer";
      schedule();
    };

    const onDown = (e: PointerEvent) => {
      stopAuto();
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = local(e);
      active.set(e.pointerId, { x, y });
      travel = 0;
      if (active.size === 2) {
        const [a, b] = Array.from(active.values());
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const onMove = (e: PointerEvent) => {
      const { x, y } = local(e);
      const prev = active.get(e.pointerId);
      if (!prev) {
        if (e.pointerType === "mouse")
          setHover(hit(x, y) >= 0 ? hit(x, y) : null, x, y);
        return;
      }
      if (active.size === 1) {
        const dx = x - prev.x;
        const dy = y - prev.y;
        travel += Math.abs(dx) + Math.abs(dy);
        if (travel > CLICK_SLOP) {
          view.yaw -= dx * DRAG_SPEED;
          view.pitch = clampPitch(view.pitch + dy * DRAG_SPEED);
          setHover(null);
          canvas.style.cursor = "grabbing";
          schedule();
        }
      } else if (active.size === 2) {
        active.set(e.pointerId, { x, y });
        const [a, b] = Array.from(active.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0)
          view.zoom = clampZoom(view.zoom * (dist / pinchDist));
        pinchDist = dist;
        travel = Infinity;
        schedule();
      }
      active.set(e.pointerId, { x, y });
    };
    const onUp = (e: PointerEvent) => {
      const { x, y } = local(e);
      const wasTap = active.size === 1 && travel <= CLICK_SLOP;
      active.delete(e.pointerId);
      pinchDist = 0;
      canvas.style.cursor = "grab";
      if (wasTap && e.type === "pointerup") {
        const idx = hit(x, y);
        if (idx >= 0) router.push(`/posts/${points[idx].slug}`);
      }
    };
    const onLeave = () => setHover(null);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAuto();
      view.zoom = clampZoom(view.zoom * Math.exp(-e.deltaY * 0.0015));
      schedule();
    };
    const onKey = (e: KeyboardEvent) => {
      const step = 0.12;
      switch (e.key) {
        case "ArrowLeft":
          view.yaw -= step;
          break;
        case "ArrowRight":
          view.yaw += step;
          break;
        case "ArrowUp":
          view.pitch = clampPitch(view.pitch + step);
          break;
        case "ArrowDown":
          view.pitch = clampPitch(view.pitch - step);
          break;
        case "+":
        case "=":
          view.zoom = clampZoom(view.zoom * 1.15);
          break;
        case "-":
        case "_":
          view.zoom = clampZoom(view.zoom / 1.15);
          break;
        default:
          return;
      }
      e.preventDefault();
      stopAuto();
      schedule();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("keydown", onKey);
    resize();
    draw();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      attrObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKey);
      requestDraw.current = () => {};
    };
  }, [points, clusters, clusterLabels, xyz, router]);

  // next-themes flips the class a tick later than it reports the theme
  useEffect(() => {
    const id = requestAnimationFrame(() => requestDraw.current());
    return () => cancelAnimationFrame(id);
  }, [resolvedTheme]);

  const topicCount = Object.keys(clusterLabels).length;
  const post = hovered === null ? null : points[hovered];

  return (
    <main className="fixed inset-0 bg-surface text-primary">
      <canvas
        ref={canvasRef}
        role="img"
        tabIndex={0}
        aria-label={`Three-dimensional map of ${points.length} posts grouped into ${topicCount} topics. Drag or use the arrow keys to turn, scroll or plus and minus to zoom. Posts are listed by topic below.`}
        className="absolute inset-0 h-full w-full cursor-grab touch-none outline-none focus-visible:ring-1 focus-visible:ring-line"
      />

      <Link
        href="/"
        className="absolute top-4 left-4 text-sm text-muted hover:text-secondary transition-colors"
      >
        back
      </Link>

      <p className="pointer-events-none absolute bottom-4 left-4 text-xs text-muted">
        {points.length.toLocaleString("en-US")} posts · {topicCount} topics ·
        drag to turn
      </p>

      <div
        ref={tooltipRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 max-w-52 border border-line bg-raised/90 px-2 py-1 text-xs backdrop-blur-xs"
        style={{ visibility: post ? "visible" : "hidden" }}
      >
        {post && (
          <>
            <div className="text-primary">{post.title}</div>
            {post.date && (
              <div className="text-muted">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </div>
            )}
          </>
        )}
      </div>

      <nav className="sr-only" aria-label="Posts by topic">
        {byCluster.map(([id, list]) => (
          <section key={id}>
            <h2>{clusterLabels[id] ?? "other"}</h2>
            <ul>
              {list.map((p) => (
                <li key={p.slug}>
                  <Link href={`/posts/${p.slug}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </main>
  );
}
