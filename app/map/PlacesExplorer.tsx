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
  categories,
  collectionPlaces,
  mapsUrl,
  placesGeoJSON,
  placesKML,
  readMapSelection,
  type Category,
  type Visit,
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
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const collection = data.collections.find((c) => c.id === collectionId);
  const allPlaces = useMemo<Visit[]>(
    () =>
      collection
        ? collectionPlaces(data, collection)
        : data.places.filter((place) =>
            data.collections.some((list) =>
              list.entries.some((entry) => entry.placeId === place.id)
            )
          ),
    [data, collection]
  );
  const places = useMemo(
    () =>
      allPlaces.filter(
        (p) =>
          (category === "all" || p.tags.includes(category)) &&
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
      const current = readMapSelection(data, params);
      setCollectionId(current.collectionId);
      setSelectedId(current.placeId);
      setSheetOpen(!current.collectionId);
      setCategory("all");
      setQuery("");
      if (
        params.get("list") !== current.collectionId ||
        params.get("place") !== current.placeId
      ) {
        const url = new URL(window.location.href);
        if (current.collectionId)
          url.searchParams.set("list", current.collectionId);
        else url.searchParams.delete("list");
        if (!current.placeId) url.searchParams.delete("place");
        window.history.replaceState(null, "", url);
      }
    };
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [data]);

  function updateUrl(list: string | null, place?: string, replace = false) {
    const url = new URL(window.location.href);
    if (list) url.searchParams.set("list", list);
    else url.searchParams.delete("list");
    if (place) url.searchParams.set("place", place);
    else url.searchParams.delete("place");
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  function clearSelection() {
    setSelectedId(null);
    updateUrl(collectionId, undefined, true);
  }
  function selectCollection(id: string | null) {
    if (panel.current) panel.current.scrollTop = 0;
    setCollectionId(id);
    setCategory("all");
    setQuery("");
    setSelectedId(null);
    setSheetOpen(true);
    setShareError(false);
    setCopied(false);
    updateUrl(id);
  }
  function toggleSheet() {
    if (!sheetOpen && panel.current) panel.current.scrollTop = 0;
    setSheetOpen(!sheetOpen);
  }
  function selectPlace(id: string) {
    const listId =
      collectionId ??
      data.collections.find((list) =>
        list.entries.some((entry) => entry.placeId === id)
      )?.id;
    if (!listId) return;
    setCollectionId(listId);
    setSelectedId(id);
    setSheetOpen(false);
    updateUrl(listId, id);
  }
  function download(format: "geojson" | "kml") {
    if (!collection) return;
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
          <h1 className="map-wordmark">PLACES</h1>
          <span>by ben</span>
        </div>
        <div className="header-actions">
          <div className="map-theme" role="group" aria-label="Map appearance">
            <button
              aria-pressed={resolvedTheme !== "dark"}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              aria-pressed={resolvedTheme === "dark"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
          {collection && (
            <details
              className="export-menu"
              ref={exports}
              onKeyDown={(event) => {
                if (event.key === "Escape" && exports.current)
                  exports.current.open = false;
              }}
            >
              <summary
                aria-label="Download this list"
                title="Download this list as KML or GeoJSON"
              >
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
                    Original list <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </details>
          )}
          {collection && (
            <button
              className="share-button"
              title={
                copied
                  ? "Link copied"
                  : selected
                    ? "Copy a link to this place"
                    : "Copy a link to this list"
              }
              aria-label={
                copied
                  ? "Link copied"
                  : selected
                    ? "Copy place link"
                    : "Copy list link"
              }
              onClick={share}
            >
              {copied ? <Check size={17} /> : <LinkIcon size={17} />}
              <span>
                {copied
                  ? "Copied"
                  : selected
                    ? "Copy place link"
                    : "Copy list link"}
              </span>
            </button>
          )}
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
        <div className="panel-section-heading">
          <h2>Lists</h2>
          <span>{data.collections.length}</span>
        </div>
        <ul className="collection-list" aria-label="Saved lists">
          {data.collections.map((list) => (
            <li key={list.id}>
              <button
                onClick={() => selectCollection(list.id)}
                aria-label={`Open ${list.title}`}
                aria-pressed={collectionId === list.id}
              >
                <span className="collection-title">
                  {list.title}
                  <ArrowUpRight size={16} />
                </span>
                <span className="collection-meta">
                  {[
                    list.location,
                    `${list.entries.length} places`,
                    list.kind === "trip" && list.date
                      ? formatDate(list.date)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="collection-description">
                  {list.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="panel-section-heading places-section-heading">
          <h2>Places</h2>
          <span aria-live="polite">{places.length}</span>
        </div>
        {collection?.post && (
          <div className="collection-heading">
            <Link
              className="journal-link"
              href={`https://bneo.xyz/posts/${collection.post}`}
            >
              Read the journal <ArrowUpRight size={13} />
            </Link>
          </div>
        )}
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
              all <span>{allPlaces.length}</span>
            </button>
            {categories
              .filter((tag) => allPlaces.some((p) => p.tags.includes(tag)))
              .map((tag) => (
                <button
                  key={tag}
                  aria-pressed={category === tag}
                  onClick={() => {
                    setCategory(category === tag ? "all" : tag);
                    clearSelection();
                  }}
                >
                  <CategoryIcon category={tag} size={12} />
                  {tag}{" "}
                  <span>
                    {
                      allPlaces.filter((place) => place.tags.includes(tag))
                        .length
                    }
                  </span>
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
                updateUrl(collectionId);
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
                <Link href={`https://bneo.xyz/posts/${selected.post}`}>
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
            {collection?.title ?? "Lists"}
            <span>{collection ? places.length : data.collections.length}</span>
          </>
        )}
      </button>
    </main>
  );
}
