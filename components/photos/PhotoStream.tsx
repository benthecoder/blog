"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StreamPhoto } from "@/types/photostream";
import { shortCamera } from "@/utils/photoCamera";
import { ContactSheet } from "./ContactSheet";
import { formatDay, formatMonth } from "./dates";
import { PhotoLightbox } from "./PhotoLightbox";
import { useLightboxHistory } from "./useLightboxHistory";

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
  // Pages no longer read ?camera= on the server (that forced a dynamic
  // render); adopt it here instead. choose() keeps it in sync afterwards.
  useEffect(() => {
    if (initialCamera) return;
    const fromUrl = new URLSearchParams(window.location.search).get("camera");
    if (fromUrl) setCamera(fromUrl);
  }, [initialCamera]);
  const [limit, setLimit] = useState(PAGE);
  const end = useRef<HTMLDivElement>(null);
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

  const [selected, onIndex] = useLightboxHistory(filtered);

  const choose = (name: string) => {
    setCamera(name);
    setLimit(PAGE);
    const url = name
      ? `?camera=${encodeURIComponent(name)}`
      : location.pathname;
    history.replaceState(null, "", url);
  };

  // Load the next batch while the end of the list is still a couple of
  // screens away, so scrolling never hits a wall. Re-observing after each
  // batch catches the case where the end is still in range.
  const more = limit < filtered.length;
  useEffect(() => {
    const element = end.current;
    if (!more || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLimit((count) => count + PAGE);
      },
      { rootMargin: "1600px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [more, limit]);

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
            onOpen={onIndex}
          />
        </section>
      ))}
      {more && <div ref={end} className="ph-end" aria-hidden />}
      <PhotoLightbox photos={filtered} index={selected} onIndex={onIndex} />
    </main>
  );
}
