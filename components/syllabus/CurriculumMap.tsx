"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { SYLLABUS_PATH } from "@/config/syllabus";
import {
  REQUIRED_AREA_IDS,
  humanName,
  mapAreas,
  mapNodes,
  mergedCourse,
  type MapNode,
  type MasteryLevel,
} from "@/lib/curriculum";

// Mastery shades are the accent role mixed into the page, so they follow
// the palette and dark mode instead of fixed hex values.
const LEVEL_CLASS: Record<MasteryLevel, string> = {
  0: "bg-surface text-primary border-line",
  1: "bg-accent/10 text-primary border-accent/25",
  2: "bg-accent/25 text-primary border-accent/40",
  3: "bg-accent/45 text-primary border-accent/60",
  4: "bg-accent/80 text-surface border-accent",
  5: "bg-accent text-surface border-accent",
};

const LEVEL_SWATCH = [
  "bg-surface border-line",
  "bg-accent/10 border-accent/25",
  "bg-accent/25 border-accent/40",
  "bg-accent/45 border-accent/60",
  "bg-accent/80 border-accent",
  "bg-accent border-accent",
];

const NODE_W = 120;
const NODE_H = 40;
const GAP_X = 22;
const GAP_Y = 14;
const PAD = 10;

type Pos = { x: number; y: number; w: number; h: number };

function layoutArea(nodes: MapNode[]) {
  const ids = new Set(nodes.map((node) => node.id));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const intra = (node: MapNode) => node.prereqs.filter((id) => ids.has(id));

  const remaining = new Set(nodes.map((node) => node.id));
  const layers: MapNode[][] = [];
  while (remaining.size) {
    const ready = [...remaining].filter((id) =>
      intra(byId.get(id)!).every((pre) => !remaining.has(pre))
    );
    const pick = ready.length ? ready : [[...remaining][0]];
    layers.push(pick.map((id) => byId.get(id)!));
    for (const id of pick) remaining.delete(id);
  }

  const maxRows = Math.max(1, ...layers.map((layer) => layer.length));
  const positions = new Map<string, Pos>();
  const totalH = maxRows * NODE_H + (maxRows - 1) * GAP_Y;
  layers.forEach((layer, col) => {
    const colH = layer.length * NODE_H + (layer.length - 1) * GAP_Y;
    layer.forEach((node, row) => {
      positions.set(node.id, {
        x: PAD + col * (NODE_W + GAP_X),
        y: PAD + (totalH - colH) / 2 + row * (NODE_H + GAP_Y),
        w: NODE_W,
        h: NODE_H,
      });
    });
  });

  const edges: { from: string; to: string }[] = [];
  for (const node of nodes) {
    for (const pre of intra(node)) {
      edges.push({ from: pre, to: node.id });
    }
  }

  return {
    positions,
    edges,
    width:
      PAD * 2 + layers.length * NODE_W + Math.max(0, layers.length - 1) * GAP_X,
    height: PAD * 2 + totalH,
  };
}

function edgePath(from: Pos, to: Pos) {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  const dx = Math.max(16, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

export default function CurriculumMap({
  levels = {},
}: {
  levels?: Record<string, MasteryLevel>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [areaFilter, setAreaFilter] = useState<string>("required");

  const dependents = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const node of mapNodes) {
      for (const pre of node.prereqs) {
        (map[pre] ||= []).push(node.id);
      }
    }
    return map;
  }, []);

  const selectedNode = selected
    ? mapNodes.find((node) => node.id === selected)
    : undefined;
  const prereqSet = new Set(selectedNode?.prereqs || []);
  const dependentSet = new Set(selected ? dependents[selected] || [] : []);

  const visibleAreas = mapAreas.filter((area) => {
    if (areaFilter === "all")
      return showOptional || REQUIRED_AREA_IDS.includes(area.id);
    if (areaFilter === "required") return REQUIRED_AREA_IDS.includes(area.id);
    return area.id === areaFilter;
  });

  const requiredAreaList = mapAreas.filter((area) =>
    REQUIRED_AREA_IDS.includes(area.id)
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-muted">
        <span>0</span>
        <span className="inline-flex items-center gap-1">
          {LEVEL_SWATCH.map((swatch, level) => (
            <i
              key={level}
              title={`${level}`}
              className={`inline-block w-3 h-3 border ${swatch}`}
            />
          ))}
        </span>
        <span>5</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <FilterChip
          active={areaFilter === "required"}
          onClick={() => {
            setAreaFilter("required");
            setShowOptional(false);
          }}
        >
          required
        </FilterChip>
        <FilterChip
          active={areaFilter === "all" || showOptional}
          onClick={() => {
            setAreaFilter("all");
            setShowOptional(true);
          }}
        >
          whole map
        </FilterChip>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {requiredAreaList.map((area) => (
          <FilterChip
            key={area.id}
            active={areaFilter === area.id}
            onClick={() => setAreaFilter(area.id)}
          >
            {area.title}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {visibleAreas.map((area) => {
          const nodes = mapNodes.filter((node) => node.area === area.id);
          const layout = layoutArea(nodes);
          const required = REQUIRED_AREA_IDS.includes(area.id);
          return (
            <section key={area.id}>
              <h3 className="m-0 mb-2 text-base font-bold text-primary">
                {area.title}
                {required ? null : (
                  <span className="font-normal text-muted"> · optional</span>
                )}
              </h3>
              <div className="overflow-x-auto">
                <div
                  className="relative"
                  style={{ width: layout.width, height: layout.height }}
                >
                  <svg
                    width={layout.width}
                    height={layout.height}
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    className="absolute inset-0 pointer-events-none"
                    aria-hidden="true"
                  >
                    {layout.edges.map((edge) => {
                      const from = layout.positions.get(edge.from);
                      const to = layout.positions.get(edge.to);
                      if (!from || !to) return null;
                      const lit =
                        selected &&
                        (selected === edge.from || selected === edge.to);
                      const dim = selected && !lit;
                      return (
                        <path
                          key={`${edge.from}-${edge.to}`}
                          d={edgePath(from, to)}
                          fill="none"
                          className="stroke-accent"
                          strokeWidth={lit ? 1.75 : 1.15}
                          strokeOpacity={dim ? 0.15 : lit ? 0.9 : 0.45}
                        />
                      );
                    })}
                  </svg>
                  {nodes.map((node) => {
                    const pos = layout.positions.get(node.id);
                    if (!pos) return null;
                    const level = levels[node.id] ?? 0;
                    const isSel = selected === node.id;
                    const isPre = prereqSet.has(node.id);
                    const isDep = dependentSet.has(node.id);
                    const dim =
                      selected && !isSel && !isPre && !isDep
                        ? "opacity-35"
                        : "";
                    const ring = isSel
                      ? "ring-2 ring-accent"
                      : isPre
                        ? "ring-2 ring-accent/50"
                        : isDep
                          ? "ring-2 ring-warning"
                          : "";
                    return (
                      <button
                        key={node.id}
                        type="button"
                        title={`${node.title} · ${level}/5`}
                        onClick={() =>
                          setSelected((cur) =>
                            cur === node.id ? null : node.id
                          )
                        }
                        className={`absolute text-left text-xs leading-tight px-2 border ${LEVEL_CLASS[level]} ${ring} ${dim}`}
                        style={{
                          left: pos.x,
                          top: pos.y,
                          width: pos.w,
                          height: pos.h,
                        }}
                      >
                        <span className="block line-clamp-2 pt-1">
                          {node.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {selectedNode ? (
        <p className="mt-4 mb-0 text-sm text-muted">
          <span className="text-primary">{selectedNode.title}</span>
          {selectedNode.items.length
            ? selectedNode.items.map((id, index) => {
                const course = mergedCourse(id);
                return (
                  <span key={id}>
                    {index === 0 ? " · " : ", "}
                    <Link href={`${SYLLABUS_PATH}/${id}`}>
                      {course ? humanName(course) : id}
                    </Link>
                  </span>
                );
              })
            : null}
          {` · ${levels[selectedNode.id] ?? 0}/5`}
          {selectedNode.prereqs.length
            ? ` · rests on ${selectedNode.prereqs
                .map(
                  (id) => mapNodes.find((node) => node.id === id)?.title || id
                )
                .join(", ")}`
            : " · no prerequisites listed"}
          {(dependents[selectedNode.id] || []).length
            ? ` · leads to ${(dependents[selectedNode.id] || [])
                .map(
                  (id) => mapNodes.find((node) => node.id === id)?.title || id
                )
                .join(", ")}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-2.5 py-1 border rounded-full ${
        active
          ? "border-accent bg-accent text-surface"
          : "border-line text-secondary"
      }`}
    >
      {children}
    </button>
  );
}
