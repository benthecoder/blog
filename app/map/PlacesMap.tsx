"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapInstance,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Maximize, Minus, Plus } from "lucide-react";
import { placesGeoJSON, type Visit } from "@/utils/places";

export default function PlacesMap({
  places,
  selected,
  dark,
  onSelect,
}: {
  places: Visit[];
  selected: Visit | null;
  dark: boolean;
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const current = useRef({ places, onSelect });
  const [ready, setReady] = useState<MapInstance | null>(null);
  const [error, setError] = useState(false);
  const [position, setPosition] = useState("");
  useEffect(() => {
    current.current = { places, onSelect };
  }, [places, onSelect]);

  useEffect(() => {
    if (!container.current) return;
    let instance: MapInstance;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: { version: 8, sources: {}, layers: [] },
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
    instance.on("load", () => setReady(instance));
    instance.on("move", () => {
      const center = instance.getCenter();
      setPosition(
        `${center.lat.toFixed(4)} / ${center.lng.toFixed(4)} · Z${instance.getZoom().toFixed(1)}`
      );
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
    // Grayscale OSM raster tiles keep this keyless, with no external font service.
    if (!instance.getSource("basemap")) {
      instance.addSource("basemap", {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      instance.addLayer({ id: "basemap", type: "raster", source: "basemap" });
    }
    instance.setPaintProperty("basemap", "raster-saturation", -1);
    instance.setPaintProperty(
      "basemap",
      "raster-brightness-min",
      dark ? 0.85 : 0
    );
    instance.setPaintProperty(
      "basemap",
      "raster-brightness-max",
      dark ? 0.12 : 1
    );
  }, [dark, ready]);

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
          "circle-color": "#858981",
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
          "circle-color": ["get", "color"],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
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
      instance.on("click", "points", (event) => {
        const id = event.features?.[0]?.properties.id;
        if (id) current.current.onSelect(String(id));
      });
      for (const layer of ["clusters", "points"]) {
        instance.on("mouseenter", layer, () => {
          instance.getCanvas().style.cursor = "pointer";
        });
        instance.on("mouseleave", layer, () => {
          instance.getCanvas().style.cursor = "";
        });
      }
      // HTML cluster labels avoid an external font service and remain crisp at all zooms.
      const labels: maplibregl.Marker[] = [];
      const renderLabels = () => {
        labels.forEach((label) => label.remove());
        labels.length = 0;
        if (!instance.isSourceLoaded("places")) return;
        const seen = new Set<number>();
        for (const feature of instance.querySourceFeatures("places")) {
          const clusterId = feature.properties?.cluster_id;
          if (
            clusterId == null ||
            seen.has(clusterId) ||
            feature.geometry.type !== "Point"
          )
            continue;
          seen.add(clusterId);
          const label = document.createElement("span");
          label.className = "cluster-label";
          label.textContent = String(feature.properties?.point_count);
          labels.push(
            new maplibregl.Marker({ element: label })
              .setLngLat(feature.geometry.coordinates as [number, number])
              .addTo(instance)
          );
          label.setAttribute("aria-hidden", "true");
          label.tabIndex = -1;
        }
      };
      instance.on("idle", renderLabels);
      instance.on("movestart", () => {
        labels.forEach((label) => label.remove());
        labels.length = 0;
      });
    }
    if (places.length) {
      const bounds = new maplibregl.LngLatBounds();
      places.forEach((place) => bounds.extend(place.coordinates));
      instance.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 500 });
    }
  }, [places, ready]);

  useEffect(() => {
    if (ready && map.current === ready && map.current.getLayer("points")) {
      map.current.setPaintProperty(
        "points",
        "circle-radius",
        selected ? ["case", ["==", ["get", "id"], selected.id], 10, 7] : 7
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
      <output className="map-position">
        {position || "37.7960 / -122.4060"}
      </output>
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
