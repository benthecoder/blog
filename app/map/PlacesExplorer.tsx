"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import ThemeSwitch from "@/components/ui/ThemeSwitch";
import PaletteSwitch from "@/components/ui/PaletteSwitch";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  Link as LinkIcon,
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
  const [collectionId, setCollectionId] = useState(data.collections[0].id);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
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
      if ((id && id !== current.id) || (place && !validPlace)) {
        const url = new URL(window.location.href);
        url.searchParams.set("list", current.id);
        if (!validPlace) url.searchParams.delete("place");
        window.history.replaceState(null, "", url);
      }
      setCategory("all");
      setQuery("");
    };
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [data]);

  function updateUrl(list: string, place?: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("list", list);
    if (place) url.searchParams.set("place", place);
    else url.searchParams.delete("place");
    window.history.pushState(null, "", url);
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
  function clearSelection() {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("place");
    window.history.replaceState(null, "", url);
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
      <aside
        ref={panel}
        id="places-panel"
        className={`places-panel${sheetOpen ? " is-open" : ""}`}
        aria-label="Lists and places"
      >
        <header className="places-header">
          <div className="places-topline">
            <Link href="/" className="home-link">
              <ArrowLeft size={14} /> benedict neo
            </Link>
            <div className="theme-options">
              <PaletteSwitch />
              <ThemeSwitch />
            </div>
          </div>
          <div className="places-title">
            <h1>places</h1>
          </div>
          <p>A few places worth remembering.</p>
        </header>
        <section className="collection-section">
          <div className="section-label">
            <h2>collections</h2>
            <span>
              {String(
                data.collections.findIndex((c) => c.id === collection.id) + 1
              ).padStart(2, "0")}
              /{String(data.collections.length).padStart(2, "0")}
            </span>
          </div>
          <div
            className="collection-options"
            role="radiogroup"
            aria-label="Choose a list or trip"
          >
            {data.collections.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={c.id === collection.id}
                onClick={() => selectCollection(c.id)}
              >
                <span className="collection-radio" />
                <span className="collection-name">
                  {c.title}
                  <small>
                    {c.kind === "trip" && c.date
                      ? formatDate(c.date)
                      : (c.location ?? "curated list")}
                  </small>
                </span>
                <span>{String(c.entries.length).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <p className="collection-description">{collection.description}</p>
          {collection.post && (
            <Link className="journal-link" href={`/posts/${collection.post}`}>
              read the journal <ArrowUpRight size={12} />
            </Link>
          )}
        </section>
        <section className="place-section">
          <div className="filters">
            <div className="section-label">
              <h2>places</h2>
              <span aria-live="polite">
                {places.length} / {allPlaces.length}
              </span>
            </div>
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
                <span>all</span>
                <span className="category-count">{allPlaces.length}</span>
              </button>
              {Object.entries(categoryColors)
                .filter(([tag]) =>
                  allPlaces.some((p) =>
                    p.tags.includes(tag as keyof typeof categoryColors)
                  )
                )
                .map(([tag, color]) => (
                  <button
                    key={tag}
                    aria-pressed={category === tag}
                    onClick={() => {
                      setCategory(category === tag ? "all" : tag);
                      clearSelection();
                    }}
                  >
                    <span>
                      <i style={{ background: color }} />
                      {tag}
                    </span>
                    <span className="category-count">
                      {
                        allPlaces.filter((p) =>
                          p.tags.includes(tag as keyof typeof categoryColors)
                        ).length
                      }
                    </span>
                  </button>
                ))}
            </div>
            <div className="place-search">
              <input
                type="search"
                aria-label="Filter places"
                placeholder="Search places"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  clearSelection();
                }}
              />
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
                >
                  <span className="place-name">
                    {collection.kind === "trip" && (
                      <span className="visit-number">
                        {String(
                          allPlaces.findIndex((p) => p.id === place.id) + 1
                        ).padStart(2, "0")}
                      </span>
                    )}
                    {place.name}
                  </span>
                  {place.note && (
                    <span className="place-note">{place.note}</span>
                  )}
                  {place.visitedOn && (
                    <span className="visit-date">
                      {formatDate(place.visitedOn)}
                    </span>
                  )}
                </button>
                <div className="place-meta">
                  <div className="place-tags">
                    {place.tags.map((tag) => (
                      <span key={tag}>
                        <i style={{ background: categoryColors[tag] }} />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a href={mapsUrl(place)} target="_blank" rel="noreferrer">
                    maps <ArrowUpRight size={12} />
                  </a>
                </div>
              </li>
            ))}
          </ul>
          {!places.length && (
            <p className="empty-places">
              No places found.
              <button
                onClick={() => {
                  setCategory("all");
                  setQuery("");
                }}
              >
                Clear filters
              </button>
            </p>
          )}
        </section>
        <section className="save-section">
          <div className="section-label">
            <h2>take these with you</h2>
          </div>
          {collection.source && (
            <a
              href={collection.source}
              target="_blank"
              rel="noreferrer"
              className="save-action"
            >
              original Corner list <ArrowUpRight size={14} />
            </a>
          )}
          <button className="save-action" onClick={() => download("kml")}>
            <span>
              download KML<small>all {allPlaces.length} places</small>
            </span>
            <Download size={14} />
          </button>
          <button className="save-action" onClick={() => download("geojson")}>
            <span>
              download GeoJSON<small>all {allPlaces.length} places</small>
            </span>
            <Download size={14} />
          </button>
        </section>
        <footer className="places-footer">
          <span>updated</span>
          <span>{formatDate(data.updated)}</span>
          <p>map tiles by OpenStreetMap</p>
          <Link href="/">
            bneo.xyz <ArrowUpRight size={12} />
          </Link>
        </footer>
      </aside>
      <section className="map-area" aria-label="Places map">
        <PlacesMap
          places={places}
          selected={selected}
          dark={dark}
          onSelect={selectPlace}
        />
        <button
          className="share-map"
          title="Copy map link"
          aria-label={copied ? "Link copied" : "Copy map link"}
          onClick={share}
        >
          {copied ? <Check size={15} /> : <LinkIcon size={15} />}
        </button>
        {shareError && (
          <p className="share-error" role="status">
            Copy the link from your address bar.
          </p>
        )}
        {selected && (
          <article className="place-detail">
            <div className="detail-heading">
              <span>
                {collection.kind === "trip" ? "trip note" : "saved place"}
              </span>
              <button
                aria-label="Close place details"
                onClick={() => {
                  setSelectedId(null);
                  updateUrl(collection.id);
                }}
              >
                <X size={15} />
              </button>
            </div>
            <h2>{selected.name}</h2>
            <p className="detail-address">{selected.address}</p>
            {selected.note && <p>{selected.note}</p>}
            {selected.visitedOn && (
              <p className="visit-date">
                visited {formatDate(selected.visitedOn)}
              </p>
            )}
            <div className="detail-links">
              <a href={mapsUrl(selected)} target="_blank" rel="noreferrer">
                Google Maps <ArrowUpRight size={12} />
              </a>
              {selected.post && (
                <Link href={`/posts/${selected.post}`}>
                  journal <ArrowUpRight size={12} />
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
        <span className="sheet-handle" />
        {sheetOpen ? (
          <>
            close <ChevronDown size={12} />
          </>
        ) : (
          "collections & places"
        )}
      </button>
    </main>
  );
}
