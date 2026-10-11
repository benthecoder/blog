"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  List,
  Link as LinkIcon,
  Search,
  X,
} from "lucide-react";
import {
  categoryColors,
  collectionPlaces,
  mapsUrl,
  placesGeoJSON,
  placesKML,
  type PlacesData,
} from "@/utils/places";
import "./map.css";
import { CategoryIcon } from "./categories";

const PlacesMap = dynamic(() => import("./PlacesMap"), { ssr: false });
const formatDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default function PlacesExplorer({ data }: { data: PlacesData }) {
  const panel = useRef<HTMLElement>(null);
  const exports = useRef<HTMLDetailsElement>(null);
  const [collectionId, setCollectionId] = useState(data.collections[0].id);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const { resolvedTheme } = useTheme();
  const collection =
    data.collections.find((c) => c.id === collectionId) ?? data.collections[0];
  const allPlaces = useMemo(
    () => collectionPlaces(data, collection),
    [data, collection]
  );
  const places = useMemo(
    () =>
      allPlaces.filter(
        (p) =>
          (category === "all" ||
            p.tags.includes(category as keyof typeof categoryColors)) &&
          `${p.name} ${p.note} ${p.address}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [allPlaces, category, query]
  );
  const selected = places.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    const closeExports = (event: PointerEvent) => {
      if (exports.current && !exports.current.contains(event.target as Node))
        exports.current.open = false;
    };
    document.addEventListener("pointerdown", closeExports);
    return () => document.removeEventListener("pointerdown", closeExports);
  }, []);

  useEffect(() => {
    const readUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("list");
      const current =
        data.collections.find((c) => c.id === id) ?? data.collections[0];
      const place = params.get("place");
      const validPlace = current.entries.some(
        (entry) => entry.placeId === place
      );
      setCollectionId(current.id);
      setSelectedId(validPlace ? place : null);
      setCategory("all");
      setQuery("");
      if ((id && id !== current.id) || (place && !validPlace)) {
        const url = new URL(window.location.href);
        url.searchParams.set("list", current.id);
        if (!validPlace) url.searchParams.delete("place");
        window.history.replaceState(null, "", url);
      }
    };
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [data]);

  function updateUrl(list: string, place?: string, replace = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("list", list);
    if (place) url.searchParams.set("place", place);
    else url.searchParams.delete("place");
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  function clearSelection() {
    setSelectedId(null);
    updateUrl(collection.id, undefined, true);
  }
  function selectCollection(id: string) {
    setCollectionId(id);
    setCategory("all");
    setQuery("");
    setSelectedId(null);
    updateUrl(id);
  }
  function toggleSheet() {
    if (!sheetOpen && panel.current) panel.current.scrollTop = 0;
    setSheetOpen(!sheetOpen);
  }
  function selectPlace(id: string) {
    setSelectedId(id);
    setSheetOpen(false);
    updateUrl(collection.id, id);
  }
  function download(format: "geojson" | "kml") {
    const text =
      format === "geojson"
        ? JSON.stringify(placesGeoJSON(allPlaces), null, 2)
        : placesKML(collection.title, allPlaces);
    const url = URL.createObjectURL(
      new Blob([text], {
        type:
          format === "geojson"
            ? "application/geo+json"
            : "application/vnd.google-earth.kml+xml",
      })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${collection.id}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    if (exports.current) exports.current.open = false;
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setShareError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setShareError(true);
    }
  }

  return (
    <main className="places-explorer">
      <header className="map-header">
        <div className="map-brand">
          <span className="map-wordmark">places</span>
          <span>by ben</span>
        </div>
        <div className="header-actions">
          <details
            className="export-menu"
            ref={exports}
            onKeyDown={(event) => {
              if (event.key === "Escape" && exports.current)
                exports.current.open = false;
            }}
          >
            <summary aria-label="Export places" title="Export places">
              <Download size={17} />
            </summary>
            <div className="export-options">
              <button onClick={() => download("kml")}>
                Download KML <Download size={14} />
              </button>
              <button onClick={() => download("geojson")}>
                Download GeoJSON <Download size={14} />
              </button>
              {collection.source && (
                <a href={collection.source} target="_blank" rel="noreferrer">
                  Original Corner list <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </details>
          <button
            className="icon-button"
            title={copied ? "Link copied" : "Copy map link"}
            aria-label={copied ? "Link copied" : "Copy map link"}
            onClick={share}
          >
            {copied ? <Check size={17} /> : <LinkIcon size={17} />}
          </button>
        </div>
        {shareError && (
          <p className="share-error" role="status">
            Copy the link from your address bar.
          </p>
        )}
      </header>
      <aside
        ref={panel}
        id="places-panel"
        className={`places-panel${sheetOpen ? " is-open" : ""}`}
        aria-label="Lists and places"
      >
        <div className="collection-heading">
          {data.collections.length > 1 ? (
            <select
              aria-label="Choose a list or trip"
              value={collection.id}
              onChange={(e) => selectCollection(e.target.value)}
            >
              {data.collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          ) : (
            <h1>{collection.title}</h1>
          )}
          <p className="collection-meta">
            {collection.location}
            <span aria-hidden="true"> · </span>
            <span aria-live="polite">
              {places.length} {places.length === 1 ? "place" : "places"}
            </span>
          </p>
          <p className="collection-description">{collection.description}</p>
          {collection.post && (
            <Link className="journal-link" href={`/posts/${collection.post}`}>
              Read the journal <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
        <div className="filters">
          <label className="place-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              aria-label="Filter places"
              placeholder="Find a place"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                clearSelection();
              }}
            />
          </label>
          <div
            className="category-options"
            role="group"
            aria-label="Filter by kind"
          >
            <button
              aria-pressed={category === "all"}
              onClick={() => {
                setCategory("all");
                clearSelection();
              }}
            >
              all
            </button>
            {Object.entries(categoryColors)
              .filter(([tag]) =>
                allPlaces.some((p) =>
                  p.tags.includes(tag as keyof typeof categoryColors)
                )
              )
              .map(([tag]) => (
                <button
                  key={tag}
                  aria-pressed={category === tag}
                  onClick={() => {
                    setCategory(category === tag ? "all" : tag);
                    clearSelection();
                  }}
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>
        <ul className="place-list">
          {places.map((place) => (
            <li
              key={place.id}
              className={place.id === selectedId ? "selected" : ""}
            >
              <button
                className="place-select"
                onClick={() => selectPlace(place.id)}
                aria-label={`Show ${place.name} on map`}
                aria-pressed={place.id === selectedId}
              >
                <span className="place-icon">
                  <CategoryIcon category={place.tags[0]} />
                </span>
                <span className="place-copy">
                  <span className="place-name">{place.name}</span>
                  {place.note && (
                    <span className="place-note">{place.note}</span>
                  )}
                  {place.visitedOn && (
                    <span className="visit-date">
                      {formatDate(place.visitedOn)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!places.length && (
          <div className="empty-places">
            <p>No places found.</p>
            <button
              onClick={() => {
                setCategory("all");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </aside>
      <section className="map-area" aria-label="Places map">
        <PlacesMap
          places={places}
          selected={selected}
          dark={resolvedTheme === "dark"}
          onSelect={selectPlace}
        />
        {selected && (
          <article className="place-detail">
            <button
              className="detail-close icon-button"
              aria-label="Close place details"
              title="Close place details"
              onClick={() => {
                setSelectedId(null);
                updateUrl(collection.id);
              }}
            >
              <X size={16} />
            </button>
            <span className="detail-category">
              <CategoryIcon category={selected.tags[0]} size={13} />
              {selected.tags.join(" / ")}
            </span>
            <h2>{selected.name}</h2>
            <p className="detail-address">{selected.address}</p>
            {selected.note && <p>{selected.note}</p>}
            {selected.visitedOn && (
              <p className="visit-date">
                Visited {formatDate(selected.visitedOn)}
              </p>
            )}
            <div className="detail-links">
              <a href={mapsUrl(selected)} target="_blank" rel="noreferrer">
                Google Maps <ArrowUpRight size={14} />
              </a>
              {selected.post && (
                <Link href={`/posts/${selected.post}`}>
                  Journal <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </article>
        )}
      </section>
      <button
        className="sheet-toggle"
        aria-expanded={sheetOpen}
        aria-controls="places-panel"
        onClick={toggleSheet}
      >
        {sheetOpen ? (
          <>
            <ChevronDown size={17} />
            Back to map
          </>
        ) : (
          <>
            <List size={17} />
            {collection.title}
            <span>{places.length}</span>
          </>
        )}
      </button>
    </main>
  );
}
