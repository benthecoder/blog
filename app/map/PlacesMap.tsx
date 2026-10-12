"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapInstance,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Maximize, Minus, Plus } from "lucide-react";
import { placesGeoJSON, type Visit } from "@/utils/places";
import { usePalette } from "@/app/providers";

export default function PlacesMap({
  places,
  selected,
  dark,
  onSelect,
  onHover,
}: {
  places: Visit[];
  selected: Visit | null;
  dark: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const { palette } = usePalette();
  const map = useRef<MapInstance | null>(null);
  const current = useRef({ places, onSelect, onHover });
  const [ready, setReady] = useState<MapInstance | null>(null);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState({
    latitude: 37.796,
    longitude: -122.406,
    zoom: 15,
  });
  useEffect(() => {
    current.current = { places, onSelect, onHover };
  }, [places, onSelect, onHover]);

  useEffect(() => {
    if (!container.current) return;
    let instance: MapInstance;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`,
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
  }, [dark]);

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
          "circle-color": "#858585",
          "circle-radius": ["step", ["get", "point_count"], 13, 10, 17, 30, 21],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
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
          "circle-stroke-color": "#ffffff",
        },
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
        paint: { "text-color": "#ffffff" },
      });
    }
    if (places.length) {
      const bounds = new maplibregl.LngLatBounds();
      places.forEach((place) => bounds.extend(place.coordinates));
      instance.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 500 });
    }
  }, [places, ready]);

  useEffect(() => {
    if (!ready || map.current !== ready || !container.current) return;
    // Read after the shared provider applies the palette's CSS variables.
    const frame = requestAnimationFrame(() => {
      if (map.current !== ready || !container.current) return;
      const style = getComputedStyle(container.current);
      const color = style.getPropertyValue("--map-marker").trim();
      const label = style.getPropertyValue("--map-paper").trim();
      for (const layer of ["points", "clusters"]) {
        if (ready.getLayer(layer))
          ready.setPaintProperty(layer, "circle-color", color);
      }
      if (ready.getLayer("cluster-counts"))
        ready.setPaintProperty("cluster-counts", "text-color", label);
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, palette, dark]);

  useEffect(() => {
    if (ready && map.current === ready && map.current.getLayer("points")) {
      map.current.setPaintProperty(
        "points",
        "circle-radius",
        selected ? ["case", ["==", ["get", "id"], selected.id], 8, 5] : 5
      );
    }
    if (ready && map.current === ready && selected)
      map.current?.flyTo({
        center: selected.coordinates,
        zoom: Math.max(map.current.getZoom(), 17),
        duration: 600,
      });
  }, [selected, ready]);

  const fit = () => {
    if (!places.length || !map.current) return;
    const bounds = new maplibregl.LngLatBounds();
    places.forEach((place) => bounds.extend(place.coordinates));
    map.current.fitBounds(bounds, { padding: 70, maxZoom: 16 });
  };
  return (
    <>
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
