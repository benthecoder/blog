"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Map as MapLibreMap,
  Marker,
  LngLatBounds,
  setWorkerUrl,
  getVersion,
  type GeoJSONSource,
  type Map as MapInstance,
  type ExpressionSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, Maximize, Minus, Plus } from "lucide-react";
import { categories, placesGeoJSON, type Visit } from "@/utils/places";
import CategoryDot from "./CategoryDot";

const styleUrl = (dark: boolean) =>
  `/map-styles/${dark ? "dark" : "positron"}.json`;
// Layers we add on top of the base style; kept when the theme swaps styles.
const OUR_LAYERS = [
  "clusters",
  "points",
  "point-labels",
  "selected-label",
  "point-targets",
  "cluster-counts",
];
// Repaint OpenFreeMap's base layers in the map's own washi/sumi palette so
// the tiles match the panel. Values are token names from the MAP section of
// app/globals.css, resolved per theme. Keyed by base layer id.
type PaintProperty = Parameters<MapInstance["setPaintProperty"]>[1];
const PLACE_LABELS = [
  "place_other",
  "place_suburb",
  "place_village",
  "place_town",
  "place_city",
  "place_city_large",
  "place_state",
  "place_country_other",
  "place_country_minor",
  "place_country_major",
];
const BASEMAP_PAINT: Record<
  string,
  Partial<Record<PaintProperty, `--map-base-${string}`>>
> = {
  background: { "background-color": "--map-base-land" },
  water: { "fill-color": "--map-base-water" },
  waterway: { "line-color": "--map-base-waterway" },
  landuse_residential: { "fill-color": "--map-base-residential" },
  landuse_park: { "fill-color": "--map-base-park" },
  landcover_wood: { "fill-color": "--map-base-wood" },
  building: {
    "fill-color": "--map-base-building",
    "fill-outline-color": "--map-base-building-line",
  },
  highway_path: { "line-color": "--map-base-path" },
  highway_minor: { "line-color": "--map-base-road" },
  highway_major_casing: { "line-color": "--map-base-road-casing" },
  highway_major_inner: { "line-color": "--map-base-highway" },
  highway_major_subtle: { "line-color": "--map-base-highway" },
  highway_motorway_casing: { "line-color": "--map-base-highway-casing" },
  highway_motorway_subtle: { "line-color": "--map-base-highway" },
  railway: { "line-color": "--map-base-rail" },
  railway_transit: { "line-color": "--map-base-rail" },
  railway_minor: { "line-color": "--map-base-rail" },
  water_name: {
    "text-color": "--map-base-water-label",
    "text-halo-color": "--map-base-water",
  },
  highway_name_other: {
    "text-color": "--map-base-road-label",
    "text-halo-color": "--map-base-halo",
  },
  highway_name_motorway: {
    "text-color": "--map-base-road-label",
    "text-halo-color": "--map-base-halo",
  },
  ...Object.fromEntries(
    PLACE_LABELS.map((id) => [
      id,
      {
        "text-color": "--map-base-place-label",
        "text-halo-color": "--map-base-halo",
      },
    ])
  ),
};
const paintBasemap = (instance: MapInstance) => {
  const tokens = getComputedStyle(instance.getContainer());
  for (const [id, paint] of Object.entries(BASEMAP_PAINT))
    if (instance.getLayer(id))
      for (const [property, token] of Object.entries(paint)) {
        const value = tokens.getPropertyValue(token).trim();
        if (value)
          instance.setPaintProperty(id, property as PaintProperty, value);
      }
};
const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
// Leave room for the floating header (mobile) and keep pins off the edges.
const fitPadding = () =>
  isMobile()
    ? { top: 90, bottom: 40, left: 40, right: 40 }
    : { top: 80, bottom: 80, left: 80, right: 80 };

/** Map ink comes from the explorer's own CSS variables (map.css), which are
 * always defined; see the note there. */
const INK_VARS = {
  accent: "--map-accent",
  muted: "--map-muted",
  primary: "--map-ink",
  surface: "--map-paper",
} as const;

function hasWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export default function PlacesMap({
  places,
  selected,
  highlightId,
  dark,
  onSelect,
  onHover,
  popup,
}: {
  places: Visit[];
  selected: Visit | null;
  highlightId: string | null;
  dark: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Card pinned above a place's dot; it follows the dot as the map moves. */
  popup: { coordinates: [number, number]; content: ReactNode } | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const categorySwatches = useRef<HTMLDivElement>(null);
  const inkSwatches = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const styleDark = useRef(dark);
  const current = useRef({
    places,
    onSelect,
    onHover,
    selectedId: selected?.id ?? "",
    highlightId,
  });
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
    return () => {
      me.current?.remove();
      me.current = null;
    };
  }, []);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [lng, lat] = popup?.coordinates ?? [];
  useEffect(() => {
    if (
      !ready ||
      map.current !== ready ||
      lng === undefined ||
      lat === undefined
    )
      return;
    const place = () => {
      const { x, y } = ready.project([lng, lat]);
      setAnchor({ x, y });
    };
    place();
    ready.on("move", place);
    ready.on("resize", place);
    return () => {
      ready.off("move", place);
      ready.off("resize", place);
    };
  }, [ready, lng, lat]);
  useEffect(() => {
    current.current = {
      places,
      onSelect,
      onHover,
      selectedId: selected?.id ?? "",
      highlightId,
    };
  }, [places, onSelect, onHover, selected, highlightId]);

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
    instance.on("style.load", () => paintBasemap(instance));
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
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || instance !== ready) return;
    const data = placesGeoJSON(places);
    const source = instance.getSource("places") as GeoJSONSource | undefined;
    if (source)
      source.setData(data).catch((error: unknown) => {
        console.error("Places map could not update its data", error);
      });
    else {
      instance.addSource("places", {
        type: "geojson",
        data,
        cluster: true,
        clusterRadius: 24,
        clusterMaxZoom: 16,
      });
      instance.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 11, 10, 13, 30, 15],
          "circle-stroke-width": 2,
        },
      });
      instance.addLayer({
        id: "points",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-radius": 5, "circle-stroke-width": 1.5 },
      });
      // Labels sit below point-targets so clicks still hit the targets.
      instance.addLayer({
        id: "point-labels",
        type: "symbol",
        source: "places",
        minzoom: 15,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-offset": [0, 0.8],
          "text-anchor": "top",
          "text-optional": true,
          "text-max-width": 9,
        },
        paint: { "text-halo-width": 1.5 },
      });
      instance.addLayer({
        id: "selected-label",
        type: "symbol",
        source: "places",
        filter: ["==", ["get", "id"], ""],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 11,
          "text-offset": [0, 0.8],
          "text-anchor": "top",
          "text-max-width": 9,
          "text-allow-overlap": true,
        },
        paint: { "text-halo-width": 1.5 },
      });
      instance.addLayer({
        id: "point-targets",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-radius": 14, "circle-opacity": 0 },
      });
      instance.on("click", "clusters", async (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const clusterSource = instance.getSource("places") as GeoJSONSource;
        try {
          const zoom = await clusterSource.getClusterExpansionZoom(
            Number(feature.properties.cluster_id)
          );
          if (map.current === instance)
            instance.easeTo({
              center: feature.geometry.coordinates as [number, number],
              zoom,
            });
        } catch {
          /* A collection can change while a cluster is expanding. */
        }
      });
      instance.on("click", "point-targets", (event) => {
        const id = event.features?.[0]?.properties.id;
        if (id) current.current.onSelect(String(id));
      });
      instance.on("mousemove", "point-targets", (event) => {
        const id = event.features?.[0]?.properties.id;
        current.current.onHover(id ? String(id) : null);
      });
      instance.on("mouseleave", "point-targets", () =>
        current.current.onHover(null)
      );
      for (const layer of ["clusters", "point-targets"]) {
        instance.on("mouseenter", layer, () => {
          instance.getCanvas().style.cursor = "pointer";
        });
        instance.on("mouseleave", layer, () => {
          instance.getCanvas().style.cursor = "";
        });
      }
      instance.addLayer({
        id: "cluster-counts",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 10,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
      });
    }
    if (places.length) {
      const bounds = new LngLatBounds();
      places.forEach((place) => bounds.extend(place.coordinates));
      instance.fitBounds(bounds, {
        padding: fitPadding(),
        maxZoom: 16,
        duration: 500,
      });
    }
  }, [places, ready]);

  // Themed colors come from CSS, like the category legend.
  const paintMarks = useCallback((instance: MapInstance) => {
    if (map.current !== instance || !instance.getLayer("points")) return;
    const ink = Object.fromEntries(
      Array.from(inkSwatches.current?.children ?? []).map((swatch) => [
        swatch.getAttribute("data-ink")!,
        getComputedStyle(swatch).color,
      ])
    );
    const colors = Array.from(categorySwatches.current?.children ?? []).flatMap(
      (swatch) => [
        swatch.getAttribute("data-category")!,
        getComputedStyle(swatch).backgroundColor,
      ]
    );
    const { selectedId, highlightId } = current.current;
    const isSelected: ExpressionSpecification = [
      "==",
      ["get", "id"],
      selectedId,
    ];
    // Hollow, so a cluster of 2 can't be mistaken for stop 2.
    instance.setPaintProperty("clusters", "circle-color", ink.surface);
    instance.setPaintProperty("clusters", "circle-stroke-color", ink.primary);
    instance.setPaintProperty("cluster-counts", "text-color", ink.primary);
    const category: ExpressionSpecification = [
      "match",
      ["get", "category"],
      colors[0],
      colors[1],
      ...colors.slice(2),
      ink.primary,
    ];
    // Small dots in their category's color; the selected one is red.
    instance.setPaintProperty("points", "circle-color", [
      "case",
      isSelected,
      ink.accent,
      category,
    ]);
    instance.setPaintProperty("points", "circle-stroke-color", ink.surface);
    instance.setPaintProperty("points", "circle-stroke-width", 1.5);
    instance.setPaintProperty("points", "circle-radius", [
      "case",
      isSelected,
      7,
      ["==", ["get", "id"], highlightId ?? ""],
      6.5,
      5,
    ]);
    instance.setPaintProperty("point-labels", "text-color", ink.primary);
    instance.setPaintProperty("point-labels", "text-halo-color", ink.surface);
    instance.setPaintProperty("selected-label", "text-color", ink.primary);
    instance.setPaintProperty("selected-label", "text-halo-color", ink.surface);
    instance.setFilter("selected-label", ["==", ["get", "id"], selectedId]);
  }, []);

  useEffect(() => {
    if (!ready || map.current !== ready) return;
    const frame = requestAnimationFrame(() => paintMarks(ready));
    return () => cancelAnimationFrame(frame);
  }, [ready, selected, highlightId, paintMarks]);

  // Swap the base style in place so the camera and our layers survive.
  useEffect(() => {
    if (!ready || map.current !== ready || styleDark.current === dark) return;
    styleDark.current = dark;
    ready.setStyle(styleUrl(dark), {
      transformStyle: (previous, next) =>
        previous?.sources.places
          ? {
              ...next,
              sources: { ...next.sources, places: previous.sources.places },
              layers: [
                ...next.layers,
                ...previous.layers.filter((layer) =>
                  OUR_LAYERS.includes(layer.id)
                ),
              ],
            }
          : next,
    });
    const repaint = () => paintMarks(ready);
    ready.once("style.load", repaint);
    return () => {
      ready.off("style.load", repaint);
    };
  }, [ready, dark, paintMarks]);

  useEffect(() => {
    if (!ready || map.current !== ready || !selected) return;
    const mobile = isMobile();
    ready.flyTo({
      center: selected.coordinates,
      zoom: Math.max(ready.getZoom(), 17),
      // Leave room for the card: above the pin on desktop, and on mobile
      // the card sits at the bottom, so the pin goes up.
      offset: mobile
        ? [0, -Math.round(window.innerHeight * 0.24)]
        : [0, Math.round(window.innerHeight * 0.18)],
      duration: 600,
    });
  }, [selected, ready]);

  const fit = () => {
    if (!places.length || !map.current) return;
    const bounds = new LngLatBounds();
    places.forEach((place) => bounds.extend(place.coordinates));
    map.current.fitBounds(bounds, { padding: fitPadding(), maxZoom: 16 });
  };
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
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          target.jumpTo(camera);
        } else {
          target.flyTo(camera);
        }
        setLocating("idle");
      },
      // Only a denial is final; a timeout or lost signal can be retried.
      (error) =>
        setLocating(error.code === error.PERMISSION_DENIED ? "failed" : "idle"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };
  return (
    <>
      <div ref={categorySwatches} hidden aria-hidden="true">
        {categories.map((category) => (
          <CategoryDot key={category} category={category} />
        ))}
      </div>
      <div ref={inkSwatches} hidden aria-hidden="true">
        {Object.entries(INK_VARS).map(([name, cssVar]) => (
          <span
            key={name}
            data-ink={name}
            style={{ color: `var(${cssVar})` }}
          />
        ))}
      </div>
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
          <Plus size={14} />
        </button>
        <button
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => map.current?.zoomOut()}
        >
          <Minus size={14} />
        </button>
        <button
          aria-label="Show all places"
          title="Show all places"
          onClick={fit}
        >
          <Maximize size={13} />
        </button>
        {canLocate && (
          <button
            aria-label={
              locating === "failed"
                ? "Location unavailable"
                : "Show my location"
            }
            title={
              locating === "failed"
                ? "Location unavailable"
                : "Show my location"
            }
            aria-busy={locating === "pending"}
            disabled={locating !== "idle"}
            onClick={locate}
          >
            <LocateFixed size={14} />
          </button>
        )}
      </div>
      {popup && anchor && (
        <div
          className="map-popup"
          style={
            { "--x": `${anchor.x}px`, "--y": `${anchor.y}px` } as CSSProperties
          }
        >
          {popup.content}
        </div>
      )}
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
