"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  REQUIRED_AREA_IDS,
  mapAreas,
  mapNodes,
  type MapNode,
  type MasteryLevel,
} from "@/lib/curriculum";

const LEVEL_CLASS: Record<MasteryLevel, string> = {
  0: "bg-paper text-ink-strong border-[#c5d0da] dark:bg-night dark:text-chalk-strong dark:border-night-rule",
  1: "bg-[#eef2f4] text-ink-strong border-[#c5d0da] dark:bg-[#1c2833] dark:text-chalk-strong dark:border-night-rule",
  2: "bg-[#c5d6e6] text-ink border-[#8aafcc] dark:bg-[#243646] dark:text-chalk-strong dark:border-[#4d7fa8]",
  3: "bg-[#8aafcc] text-ink border-ink dark:bg-[#2a3f52] dark:text-chalk-strong dark:border-chalk",
  4: "bg-[#4d7fa8] text-paper border-ink dark:bg-[#4d7fa8] dark:text-paper dark:border-chalk",
  5: "bg-ink text-paper border-ink dark:bg-chalk dark:text-night dark:border-chalk",
};

const LEVEL_SWATCH = [
  "bg-paper border-[#c5d0da]",
  "bg-[#eef2f4] border-[#c5d0da]",
  "bg-[#c5d6e6] border-[#8aafcc]",
  "bg-[#8aafcc] border-ink",
  "bg-[#4d7fa8] border-ink",
  "bg-ink border-ink",
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-ink-soft dark:text-chalk-soft mb-4">
        <span>mastery</span>
        <span className="inline-flex items-center gap-1">
          {LEVEL_SWATCH.map((swatch, level) => (
            <i
              key={level}
              title={`${level}`}
              className={`inline-block w-3 h-3 border ${swatch}`}
            />
          ))}
        </span>
        <span className="font-mono text-[12px] text-ink-muted">0–5</span>
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
      <div className="flex flex-wrap gap-2 mb-5">
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

      <div className="flex flex-col gap-4">
        {visibleAreas.map((area) => {
          const nodes = mapNodes.filter((node) => node.area === area.id);
          const layout = layoutArea(nodes);
          const required = REQUIRED_AREA_IDS.includes(area.id);
          return (
            <section
              key={area.id}
              className={`p-3.5 border ${
                required
                  ? "border-ink/25 dark:border-chalk/25"
                  : "border-rule dark:border-night-rule opacity-80"
              }`}
            >
              <h3 className="font-mono text-2xs tracking-[0.14em] uppercase text-ink-muted mt-0 mb-3">
                {area.title}
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
                          stroke={dim ? "#c5d0da" : "#8aafcc"}
                          strokeWidth={lit ? 1.75 : 1.15}
                          strokeOpacity={dim ? 0.35 : 0.9}
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
                      ? "ring-2 ring-ink dark:ring-chalk"
                      : isPre
                        ? "ring-2 ring-[#8aafcc]"
                        : isDep
                          ? "ring-2 ring-[#b0693d]"
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
                        className={`absolute text-left text-[11px] leading-tight px-2 border ${LEVEL_CLASS[level]} ${ring} ${dim}`}
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
        <p className="text-[13px] text-ink-soft dark:text-chalk-soft mt-4 mb-0">
          <span className="text-ink-strong dark:text-chalk-strong">
            {selectedNode.title}
          </span>
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
      className={`text-[13px] px-2.5 py-1 border rounded-full ${
        active
          ? "border-ink bg-ink text-paper dark:border-chalk dark:bg-chalk dark:text-night"
          : "border-rule dark:border-night-rule text-ink-soft dark:text-chalk-soft"
      }`}
    >
      {children}
    </button>
  );
}
