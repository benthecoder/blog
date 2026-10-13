"use client";

import { useState } from "react";
import type { StreamPhoto } from "@/types/photostream";
import { shortCamera } from "@/utils/photoCamera";
import { ContactSheet } from "./ContactSheet";
import { formatMonth } from "./dates";
import { PhotoLightbox } from "./PhotoLightbox";

const PAGE = 36;

export function PhotoStream({
  photos,
  initialCamera = "",
  summary,
}: {
  photos: StreamPhoto[];
  initialCamera?: string;
  summary?: string;
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

  const months: { label: string; start: number; photos: StreamPhoto[] }[] = [];
  filtered.slice(0, limit).forEach((photo, index) => {
    const label = formatMonth(photo.date);
    const last = months.at(-1);
    if (last?.label === label) last.photos.push(photo);
    else months.push({ label, start: index, photos: [photo] });
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
      <h1 className="ph-sr">All photos</h1>
      {summary && <p className="ph-mono ph-summary">{summary}</p>}
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
      {months.map((month) => (
        <section key={month.label + month.start}>
          <h2 className="ph-month ph-mono">
            <span>{month.label}</span>
            <span>
              {month.photos.length}{" "}
              {month.photos.length === 1 ? "frame" : "frames"}
            </span>
          </h2>
          <ContactSheet
            photos={month.photos}
            offset={month.start}
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
