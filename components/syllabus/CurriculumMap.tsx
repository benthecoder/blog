"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  REQUIRED_AREA_IDS,
  mapAreas,
  mapNodes,
  type NodeState,
} from "@/lib/curriculum";

const STATE_CLASS: Record<NodeState, string> = {
  mastered:
    "bg-ink text-paper border-ink dark:bg-chalk dark:text-night dark:border-chalk",
  "in-progress":
    "bg-[#d7e4f0] text-ink-strong border-ink dark:bg-[#2a3f52] dark:text-chalk-strong dark:border-chalk",
  weak: "bg-[#f3e0d4] text-[#8a4e28] border-[#b0693d] dark:bg-[#3a2a22] dark:text-[#e0b496] dark:border-[#b0693d]",
  "not-started":
    "bg-paper text-ink-strong border-[#c5d0da] dark:bg-night dark:text-chalk-strong dark:border-night-rule",
};

export default function CurriculumMap({
  states,
}: {
  states: Record<string, NodeState>;
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

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-ink-soft dark:text-chalk-soft mb-4">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-3 h-3 rounded-full border border-ink bg-ink dark:border-chalk dark:bg-chalk" />
          mastered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-3 h-3 rounded-full border border-ink bg-[#8aafcc]" />
          in progress
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-3 h-3 rounded-full border border-[#b0693d] bg-[#f3e0d4]" />
          weak
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-3 h-3 rounded-full border border-[#c5d0da] bg-paper" />
          not started
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip
          active={areaFilter === "required"}
          onClick={() => {
            setAreaFilter("required");
            setShowOptional(false);
          }}
        >
          required tracks
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
        {mapAreas
          .filter((area) => REQUIRED_AREA_IDS.includes(area.id))
          .map((area) => (
            <FilterChip
              key={area.id}
              active={areaFilter === area.id}
              onClick={() => setAreaFilter(area.id)}
            >
              {area.title}
            </FilterChip>
          ))}
      </div>

      <p className="text-[13px] text-ink-muted mb-4">
        Almost everything is still unlit. The first week begins the night of
        November 9. Click a concept to see what it rests on, and what rests on
        it.
      </p>

      <div className="columns-1 sm:columns-2 gap-4">
        {visibleAreas.map((area) => {
          const nodes = mapNodes.filter((node) => node.area === area.id);
          const required = REQUIRED_AREA_IDS.includes(area.id);
          return (
            <section
              key={area.id}
              className={`p-3.5 mb-4 break-inside-avoid border ${
                required
                  ? "border-ink/25 dark:border-chalk/25"
                  : "border-rule dark:border-night-rule opacity-70"
              }`}
            >
              <h3 className="font-mono text-2xs tracking-[0.14em] uppercase text-ink-muted mt-0 mb-3">
                {area.title}
                {required ? "" : " · optional"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {nodes.map((node) => {
                  const state = states[node.id] || "not-started";
                  const isSel = selected === node.id;
                  const isPre = prereqSet.has(node.id);
                  const isDep = dependentSet.has(node.id);
                  const dim =
                    selected && !isSel && !isPre && !isDep ? "opacity-35" : "";
                  const ring = isSel
                    ? "ring-2 ring-ink dark:ring-chalk"
                    : isPre
                      ? "ring-2 ring-[#8aafcc]"
                      : isDep
                        ? "ring-2 ring-dashed ring-[#b0693d]"
                        : "";
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() =>
                        setSelected((cur) => (cur === node.id ? null : node.id))
                      }
                      className={`text-left text-[13px] leading-snug px-2.5 py-1 border rounded-full ${STATE_CLASS[state]} ${ring} ${dim}`}
                    >
                      {node.title}
                    </button>
                  );
                })}
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
