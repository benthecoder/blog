"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Map as MapLibreMap,
  Marker,
  LngLatBounds,
  setWorkerUrl,
  getVersion,
  type Map as MapInstance,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, Minus, Plus } from "lucide-react";
import type { Visit } from "@/utils/places";

const styleUrl = (dark: boolean) =>
  `/map-styles/${dark ? "dark" : "positron"}.json`;

// The basemap is a quiet backdrop for the numbered places, like the base of a
// printed guide map: no shields, no small street names, no airports. The two
// OpenFreeMap styles name their layers differently, so rules match by pattern.
const HIDDEN =
  /shield|airport|oneway|highway-name-(minor|path)|label_(state|country)|place_(state|country)|boundary/;
type PaintProperty = Parameters<MapInstance["setPaintProperty"]>[1];
type Token = `--map-base-${string}`;
const FILLS: [RegExp, Partial<Record<PaintProperty, Token>>][] = [
  [/^background$/, { "background-color": "--map-base-land" }],
  [/^water$/, { "fill-color": "--map-base-water" }],
  [/^waterway$/, { "line-color": "--map-base-waterway" }],
  [/^landuse_residential$/, { "fill-color": "--map-base-residential" }],
  [/park$/, { "fill-color": "--map-base-park" }],
  [/^landcover_wood$/, { "fill-color": "--map-base-wood" }],
  [
    /^building$/,
    {
      "fill-color": "--map-base-building",
      "fill-outline-color": "--map-base-building-line",
    },
  ],
  [/^highway_path$/, { "line-color": "--map-base-path" }],
  [/^highway_minor$/, { "line-color": "--map-base-road" }],
  [/casing$/, { "line-color": "--map-base-road-casing" }],
  [/(major|motorway).*(inner|subtle)$/, { "line-color": "--map-base-highway" }],
  [/^railway/, { "line-color": "--map-base-rail" }],
];
const labelToken = (id: string): Token =>
  /water/.test(id)
    ? "--map-base-water-label"
    : /highway/.test(id)
      ? "--map-base-road-label"
      : "--map-base-place-label";

const paintBasemap = (instance: MapInstance) => {
  const tokens = getComputedStyle(instance.getContainer());
  const token = (name: Token) => tokens.getPropertyValue(name).trim();
  for (const layer of instance.getStyle().layers) {
    const { id } = layer;
    if (HIDDEN.test(id)) {
      instance.setLayoutProperty(id, "visibility", "none");
      continue;
    }
    if (layer.type === "symbol") {
      instance.setPaintProperty(id, "text-color", token(labelToken(id)));
      instance.setPaintProperty(
        id,
        "text-halo-color",
        token("--map-base-halo")
      );
      instance.setPaintProperty(id, "text-halo-blur", 0);
      continue;
    }
    const paint = FILLS.find(([pattern]) => pattern.test(id))?.[1];
    for (const [property, name] of Object.entries(paint ?? {})) {
      const value = token(name);
      if (value)
        instance.setPaintProperty(id, property as PaintProperty, value);
    }
  }
};

const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
// The bottom clears the attribution line.
const fitPadding = () =>
  isMobile()
    ? { top: 36, right: 36, bottom: 48, left: 36 }
    : { top: 72, right: 72, bottom: 72, left: 72 };
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Marks closer than a mark's width would hide each other's numerals, so a
// cluster fans out in a ring around its centre, numbered clockwise from the top.
const MARK = 26;
function declutter(instance: MapInstance, marks: Marker[]) {
  // Plain dots on the index may pile up: a pile still reads as "here".
  if (marks.some((mark) => mark.getElement().classList.contains("is-dot")))
    return marks.forEach((mark) => mark.setOffset([0, 0]));
  const points = marks.map((mark) => instance.project(mark.getLngLat()));
  const group = marks.map(() => -1);
  points.forEach((_, start) => {
    if (group[start] !== -1) return;
    group[start] = start;
    const queue = [start];
    while (queue.length) {
      const i = queue.pop()!;
      points.forEach((point, j) => {
        if (group[j] === -1 && point.dist(points[i]) < MARK) {
          group[j] = start;
          queue.push(j);
        }
      });
    }
  });
  marks.forEach((mark, i) => {
    const members = marks.flatMap((_, j) => (group[j] === group[i] ? [j] : []));
    if (members.length === 1) return mark.setOffset([0, 0]);
    const x = members.reduce((sum, j) => sum + points[j].x, 0) / members.length;
    const y = members.reduce((sum, j) => sum + points[j].y, 0) / members.length;
    const radius = MARK / 2 / Math.sin(Math.PI / Math.max(members.length, 2));
    const angle =
      (2 * Math.PI * members.indexOf(i)) / members.length - Math.PI / 2;
    mark.setOffset([
      x + radius * Math.cos(angle) - points[i].x,
      y + radius * Math.sin(angle) - points[i].y,
    ]);
  });
}

function hasWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export default function PlacesMap({
  places,
  numbered,
  selectedId,
  litId,
  dark,
  onSelect,
  onHover,
}: {
  places: Visit[];
  /** Number the marks to match the list; the index shows plain dots. */
  numbered: boolean;
  selectedId: string | null;
  litId: string | null;
  dark: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const marks = useRef(new Map<string, Marker>());
  const styleDark = useRef(dark);
  const handlers = useRef({ onSelect, onHover });
  const [ready, setReady] = useState<MapInstance | null>(null);
  const [error, setError] = useState(false);
  const canLocate = useSyncExternalStore(
    () => () => {},
    () => "geolocation" in navigator,
    () => false
  );
  const [locating, setLocating] = useState<"idle" | "pending" | "failed">(
    "idle"
  );
  const me = useRef<Marker | null>(null);

  useEffect(() => {
    handlers.current = { onSelect, onHover };
  }, [onSelect, onHover]);

  useEffect(() => {
    if (!container.current) return;
    // MapLibre builds half an instance before it notices there is no WebGL,
    // and its teardown then throws past our catch. Ask the browser first.
    if (!hasWebGL2()) {
      setError(true);
      return;
    }
    let instance: MapInstance;
    try {
      setWorkerUrl(`/vendor/maplibre/${getVersion()}/maplibre-gl-worker.mjs`);
      instance = new MapLibreMap({
        container: container.current,
        style: styleUrl(styleDark.current),
        center: [-122.406, 37.796],
        zoom: 15,
        pixelRatio: 1,
        attributionControl: { compact: false },
        maxZoom: 19,
      });
    } catch {
      setError(true);
      return;
    }
    map.current = instance;
    const placed = marks.current;
    instance.on("style.load", () => paintBasemap(instance));
    instance.on("zoom", () => declutter(instance, [...placed.values()]));
    instance.on("load", () => {
      if (map.current === instance) setReady(instance);
    });
    // resize() clears the canvas and MapLibre repaints on its next frame, so a
    // width change flashed the empty background. Redraw in the same frame.
    const resize = new ResizeObserver(() => {
      instance.resize();
      if (instance.isStyleLoaded()) instance.redraw();
    });
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      placed.forEach((mark) => mark.remove());
      placed.clear();
      me.current?.remove();
      me.current = null;
      instance.remove();
      map.current = null;
    };
  }, []);

  // Marks are DOM, so the numerals set in the page's serif. The list is the
  // keyboard and screen-reader route to the same places, so marks stay out of
  // the tab order.
  useEffect(() => {
    const instance = map.current;
    if (!instance || instance !== ready) return;
    marks.current.forEach((mark) => mark.remove());
    marks.current.clear();
    places.forEach((place, index) => {
      const element = document.createElement("div");
      element.className = numbered ? "map-mark" : "map-mark is-dot";
      element.textContent = numbered ? String(index + 1) : "";
      element.setAttribute("aria-hidden", "true");
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        handlers.current.onSelect(place.id);
      });
      element.addEventListener("mouseenter", () =>
        handlers.current.onHover(place.id)
      );
      element.addEventListener("mouseleave", () =>
        handlers.current.onHover(null)
      );
      marks.current.set(
        place.id,
        new Marker({ element }).setLngLat(place.coordinates).addTo(instance)
      );
    });
    declutter(instance, [...marks.current.values()]);
    if (places.length) {
      const bounds = new LngLatBounds();
      places.forEach((place) => bounds.extend(place.coordinates));
      instance.fitBounds(bounds, {
        padding: fitPadding(),
        maxZoom: 16,
        duration: reducedMotion() ? 0 : 500,
      });
    }
  }, [places, numbered, ready]);

  useEffect(() => {
    marks.current.forEach((mark, id) => {
      const element = mark.getElement();
      element.classList.toggle("is-selected", id === selectedId);
      element.classList.toggle("is-lit", id === litId);
    });
  }, [places, selectedId, litId, ready]);

  useEffect(() => {
    if (!ready || map.current !== ready || styleDark.current === dark) return;
    styleDark.current = dark;
    ready.setStyle(styleUrl(dark));
  }, [ready, dark]);

  useEffect(() => {
    const place = places.find((p) => p.id === selectedId);
    if (!ready || map.current !== ready || !place) return;
    const camera = {
      center: place.coordinates,
      zoom: Math.max(ready.getZoom(), 16),
    };
    if (reducedMotion()) ready.jumpTo(camera);
    else ready.easeTo({ ...camera, duration: 600 });
  }, [places, selectedId, ready]);

  const locate = () => {
    const target = map.current;
    if (!target || locating !== "idle") return;
    setLocating("pending");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (map.current !== target) return;
        const center: [number, number] = [coords.longitude, coords.latitude];
        if (!me.current) {
          const dot = document.createElement("div");
          dot.className = "map-me";
          me.current = new Marker({ element: dot }).setLngLat(center);
          me.current.addTo(target);
        } else {
          me.current.setLngLat(center);
        }
        const camera = { center, zoom: Math.max(target.getZoom(), 15) };
        if (reducedMotion()) target.jumpTo(camera);
        else target.flyTo(camera);
        setLocating("idle");
      },
      // Only a denial is final; a timeout or lost signal can be retried.
      (error) =>
        setLocating(error.code === error.PERMISSION_DENIED ? "failed" : "idle"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };
  const locateLabel =
    locating === "failed" ? "Location unavailable" : "Show my location";
  return (
    <>
      <div
        ref={container}
        className="map-canvas"
        role="region"
        aria-label="Map of saved places"
      />
      <div className="map-tools">
        <button
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => map.current?.zoomIn()}
        >
          <Plus size={15} />
        </button>
        <button
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => map.current?.zoomOut()}
        >
          <Minus size={15} />
        </button>
        {canLocate && (
          <button
            aria-label={locateLabel}
            title={locateLabel}
            aria-busy={locating === "pending"}
            disabled={locating !== "idle"}
            onClick={locate}
          >
            <LocateFixed size={15} />
          </button>
        )}
      </div>
      {!ready && (
        <div className="map-status" role="status">
          {error
            ? "map unavailable in this browser. the list still works."
            : "Loading map..."}
        </div>
      )}
    </>
  );
}
