"use client";

import { useState, type ReactNode } from "react";
import type { StreamPhoto } from "@/types/photostream";
import { shortCamera } from "@/utils/photoCamera";
import { ContactSheet } from "./ContactSheet";
import { formatDay, formatMonth } from "./dates";
import { PhotoLightbox } from "./PhotoLightbox";

const PAGE = 36;

// Every collection page (all photos, a city, a trip) is this same stream
// under its own header, so they all browse the same way.
export function PhotoStream({
  photos,
  header,
  groupBy = "month",
  initialCamera = "",
}: {
  photos: StreamPhoto[];
  header: ReactNode;
  groupBy?: "month" | "day";
  initialCamera?: string;
}) {
  const [camera, setCamera] = useState(initialCamera);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<number | null>(null);
  const counts = new Map<string, number>();
  for (const photo of photos) {
    const name = shortCamera(photo.camera);
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const tabs = [...counts].sort((a, b) => b[1] - a[1]);
  const active = tabs.some(([name]) => name === camera) ? camera : "";
  const filtered = active
    ? photos.filter((photo) => shortCamera(photo.camera) === active)
    : photos;

  const label = groupBy === "day" ? formatDay : formatMonth;
  const groups: { label: string; start: number; photos: StreamPhoto[] }[] = [];
  filtered.slice(0, limit).forEach((photo, index) => {
    const name = label(photo.date);
    const last = groups.at(-1);
    if (last?.label === name) last.photos.push(photo);
    else groups.push({ label: name, start: index, photos: [photo] });
  });

  const choose = (name: string) => {
    setCamera(name);
    setLimit(PAGE);
    const url = name
      ? `?camera=${encodeURIComponent(name)}`
      : location.pathname;
    history.replaceState(null, "", url);
  };

  return (
    <main className="ph-page ph-stream">
      {header}
      {/* A filter with one option has nothing to choose. */}
      {tabs.length > 1 && (
        <div
          className="ph-tabs ph-mono"
          role="group"
          aria-label="Filter by camera"
        >
          {[["", photos.length] as const, ...tabs].map(([name, count]) => (
            <button
              key={name}
              aria-pressed={name === active}
              onClick={() => choose(name)}
            >
              {name || "All"} <span>{count}</span>
            </button>
          ))}
        </div>
      )}
      {groups.map((group) => (
        <section key={group.label + group.start}>
          <h2 className="ph-month ph-mono">
            <span>{group.label}</span>
            <span>
              {group.photos.length}{" "}
              {group.photos.length === 1 ? "frame" : "frames"}
            </span>
          </h2>
          <ContactSheet
            photos={group.photos}
            offset={group.start}
            onOpen={setSelected}
          />
        </section>
      ))}
      {limit < filtered.length && (
        <button
          className="ph-button ph-mono"
          onClick={() => setLimit((count) => count + PAGE)}
        >
          Load more frames →
        </button>
      )}
      <PhotoLightbox photos={filtered} index={selected} onIndex={setSelected} />
    </main>
  );
}
