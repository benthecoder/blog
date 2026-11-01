"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { PlaceGroup } from "@/utils/content/travel";
import "maplibre-gl/dist/maplibre-gl.css";
export default function PlacesOverviewMap({
  groups,
}: {
  groups: PlaceGroup[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const { resolvedTheme } = useTheme();
  const points = useMemo(() => {
    const out: {
      id: string;
      label: string;
      count: number;
      coordinates: readonly [number, number];
    }[] = [];
    const visit = (place: PlaceGroup) => {
      if (place.posts.length && place.coordinates)
        out.push({
          id: place.id,
          label: place.label,
          count: place.count,
          coordinates: place.coordinates,
        });
      place.children.forEach(visit);
    };
    groups.forEach(visit);
    return out;
  }, [groups]);
  useEffect(() => {
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
    import("maplibre-gl")
      .then((lib) => {
        if (disposed || !container.current) return;
        lib.setWorkerUrl(
          `/vendor/maplibre/${lib.getVersion()}/maplibre-gl-worker.mjs`
        );
        map = new lib.Map({
          container: container.current,
          style: `/map-styles/${resolvedTheme === "dark" ? "dark" : "positron"}.json`,
          center: [0, 25],
          zoom: 1,
          cooperativeGestures: true,
          dragRotate: false,
          attributionControl: { compact: true },
        });
        map.addControl(
          new lib.NavigationControl({ showCompass: false }),
          "top-right"
        );
        const bounds = new lib.LngLatBounds();
        for (const point of points) {
          const link = document.createElement("a");
          link.href = `#place-${point.id}`;
          link.title = `${point.label} · ${point.count} posts`;
          link.setAttribute("aria-label", `Show ${point.label} posts`);
          link.className =
            "block h-3.5 w-3.5 rounded-full border-2 border-paper bg-accent shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";
          new lib.Marker({ element: link })
            .setLngLat([...point.coordinates])
            .addTo(map);
          bounds.extend([...point.coordinates]);
        }
        map.once("load", () => {
          if (!bounds.isEmpty())
            map?.fitBounds(bounds, { padding: 35, maxZoom: 5, duration: 0 });
        });
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [points, resolvedTheme]);
  if (failed)
    return (
      <p className="text-xs text-muted">
        map unavailable — browse the places below
      </p>
    );
  return (
    <div>
      <div
        ref={container}
        role="region"
        aria-label="Places map"
        className="h-64 sm:h-80 w-full border border-line rounded-xs overflow-hidden"
      />
      <p className="mt-2 text-xs text-muted">
        select a place on the map to jump to its posts
      </p>
    </div>
  );
}
