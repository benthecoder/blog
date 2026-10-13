"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  LngLatBounds,
  setWorkerUrl,
  getVersion,
  type GeoJSONSource,
  type Map as MapInstance,
  type ExpressionSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Maximize, Minus, Plus } from "lucide-react";
import { categories, placesGeoJSON, type Visit } from "@/utils/places";
import CategoryDot from "./CategoryDot";

const styleUrl = (dark: boolean) =>
  `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`;
// Layers we add on top of the base style; kept when the theme swaps styles.
const OUR_LAYERS = [
  "clusters",
  "points",
  "point-labels",
  "selected-label",
  "point-targets",
  "cluster-counts",
];
// OpenFreeMap's dark style sits near pure black with ~2.4:1 street labels.
// Lift it onto the blog's night surface (#1a1a1a) and brighten roads and
// names so the map reads like the light one. Keyed by base layer id.
type PaintProperty = Parameters<MapInstance["setPaintProperty"]>[1];
const DARK_LAYER_PAINT: Record<
  string,
  Partial<Record<PaintProperty, string>>
> = {
  background: { "background-color": "#1a1a1a" },
  water: { "fill-color": "#131518" },
  waterway: { "line-color": "#131518" },
  landuse_residential: { "fill-color": "#1c1c1c" },
  landuse_park: { "fill-color": "#1e231f" },
  landcover_wood: { "fill-color": "#1e231f" },
  building: { "fill-color": "#232323", "fill-outline-color": "#2c2c2c" },
  highway_path: { "line-color": "#2e2e2e" },
  highway_minor: { "line-color": "#303030" },
  highway_major_casing: { "line-color": "#3c3c3c" },
  highway_major_inner: { "line-color": "#343434" },
  highway_major_subtle: { "line-color": "#343434" },
  highway_motorway_casing: { "line-color": "#454545" },
  highway_motorway_subtle: { "line-color": "#343434" },
  railway: { "line-color": "#333333" },
  railway_transit: { "line-color": "#333333" },
  railway_minor: { "line-color": "#333333" },
  water_name: { "text-color": "#6e7681", "text-halo-color": "#131518" },
  highway_name_other: { "text-color": "#8f8f8f", "text-halo-color": "#1a1a1a" },
  highway_name_motorway: { "text-color": "#9a9a9a" },
  ...Object.fromEntries(
    [
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
    ].map((id) => [
      id,
      { "text-color": "#a8a8a8", "text-halo-color": "rgba(26,26,26,0.85)" },
    ])
  ),
};
const liftDarkBasemap = (instance: MapInstance) => {
  for (const [id, paint] of Object.entries(DARK_LAYER_PAINT))
    if (instance.getLayer(id))
      for (const [property, value] of Object.entries(paint))
        instance.setPaintProperty(id, property as PaintProperty, value);
};
const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
// Leave room for the floating header (mobile) and keep pins off the edges.
const fitPadding = () =>
  isMobile()
    ? { top: 90, bottom: 40, left: 40, right: 40 }
    : { top: 80, bottom: 80, left: 80, right: 80 };

export default function PlacesMap({
  places,
  selected,
  highlightId,
  dark,
  onSelect,
  onHover,
}: {
  places: Visit[];
  selected: Visit | null;
  highlightId: string | null;
  dark: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
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
  const [position, setPosition] = useState({
    latitude: 37.796,
    longitude: -122.406,
    zoom: 15,
  });
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
    instance.on("style.load", () => {
      if (styleDark.current) liftDarkBasemap(instance);
    });
    const updatePosition = () => {
      const center = instance.getCenter();
      setPosition({
        latitude: center.lat,
        longitude: center.lng,
        zoom: instance.getZoom(),
      });
    };
    instance.on("move", updatePosition);
    instance.on("load", () => {
      if (map.current === instance) setReady(instance);
    });
    const resize = new ResizeObserver(() => instance.resize());
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
    if (source) source.setData(data);
    else {
      instance.addSource("places", {
        type: "geojson",
        data,
        cluster: true,
        clusterRadius: 35,
        clusterMaxZoom: 16,
      });
      instance.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": ["step", ["get", "point_count"], 13, 10, 17, 30, 21],
          "circle-stroke-width": 2,
        },
      });
      instance.addLayer({
        id: "points",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#656565",
          "circle-stroke-width": 2,
        },
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
          "text-size": 12,
          "text-offset": [0, 1.1],
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
          "text-size": 12,
          "text-offset": [0, 1.1],
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
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
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
    instance.setPaintProperty("clusters", "circle-color", ink.accent);
    instance.setPaintProperty("clusters", "circle-stroke-color", ink.surface);
    instance.setPaintProperty("cluster-counts", "text-color", ink.surface);
    instance.setPaintProperty("points", "circle-color", [
      "match",
      ["get", "category"],
      colors[0],
      colors[1],
      ...colors.slice(2),
      "#656565",
    ]);
    instance.setPaintProperty("points", "circle-stroke-color", [
      "case",
      isSelected,
      ink.accent,
      ink.surface,
    ]);
    instance.setPaintProperty("points", "circle-stroke-width", [
      "case",
      isSelected,
      3,
      2,
    ]);
    instance.setPaintProperty("points", "circle-radius", [
      "case",
      isSelected,
      8,
      ["==", ["get", "id"], highlightId ?? ""],
      7,
      5,
    ]);
    instance.setPaintProperty("point-labels", "text-color", ink.muted);
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
      // Keep the pin clear of the detail card (left on desktop, bottom on mobile).
      offset: mobile ? [0, -80] : [150, 0],
      duration: 600,
    });
  }, [selected, ready]);

  const fit = () => {
    if (!places.length || !map.current) return;
    const bounds = new LngLatBounds();
    places.forEach((place) => bounds.extend(place.coordinates));
    map.current.fitBounds(bounds, { padding: fitPadding(), maxZoom: 16 });
  };
  return (
    <>
      <div ref={categorySwatches} hidden aria-hidden="true">
        {categories.map((category) => (
          <CategoryDot key={category} category={category} />
        ))}
      </div>
      <div ref={inkSwatches} hidden aria-hidden="true">
        {["accent", "muted", "primary", "surface"].map((name) => (
          <span
            key={name}
            data-ink={name}
            style={{ color: `var(--color-${name})` }}
          />
        ))}
      </div>
      <div
        ref={container}
        className="map-canvas"
        role="region"
        aria-label="Map of saved places"
      />
      <output
        className="map-position"
        aria-label="Map center latitude, longitude and zoom"
      >
        {position.latitude.toFixed(4)} / {position.longitude.toFixed(4)} · Z
        {position.zoom.toFixed(1)}
      </output>
      <div className="map-tools">
        <button
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => map.current?.zoomIn()}
        >
          <Plus size={16} />
        </button>
        <button
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => map.current?.zoomOut()}
        >
          <Minus size={16} />
        </button>
        <button
          aria-label="Show all places"
          title="Show all places"
          onClick={fit}
        >
          <Maximize size={15} />
        </button>
      </div>
      {!ready && (
        <div className="map-status" role="status">
          {error
            ? "Map unavailable. Places and directions are still available in the list."
            : "Loading map..."}
        </div>
      )}
    </>
  );
}
