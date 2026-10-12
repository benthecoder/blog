"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowUpRight, ChevronDown, List, Search, X } from "lucide-react";
import {
  categories,
  collectionPlaces,
  filterPlaces,
  mapsUrl,
  readMapSelection,
  type Category,
  type Visit,
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
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
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
    () => filterPlaces(allPlaces, selectedCategories, query),
    [allPlaces, selectedCategories, query]
  );
  const selected = places.find((p) => p.id === selectedId) ?? null;
  const detail = places.find((p) => p.id === hoveredId) ?? selected;

  useEffect(() => {
    const dismissPreview = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHoveredId(null);
    };
    document.addEventListener("keydown", dismissPreview);
    return () => {
      document.removeEventListener("keydown", dismissPreview);
    };
  }, []);

  useEffect(() => {
    const readUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const current = readMapSelection(data, params);
      setCollectionId(current.collectionId);
      setSelectedId(current.placeId);
      setSheetOpen(!current.collectionId);
      setSelectedCategories([]);
      setHoveredId(null);
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
    setHoveredId(null);
    updateUrl(collectionId, undefined, true);
  }
  function selectCollection(id: string | null) {
    if (panel.current) panel.current.scrollTop = 0;
    setCollectionId(id);
    setSelectedCategories([]);
    setHoveredId(null);
    setQuery("");
    setSelectedId(null);
    setSheetOpen(true);
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
        </div>
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
                  <span className="collection-count">
                    {list.entries.length}
                  </span>
                </span>
              </button>
              {collectionId === list.id && (
                <div className="collection-summary">
                  {list.location && (
                    <p className="collection-meta">
                      {list.location}
                      {list.date ? ` · ${formatDate(list.date)}` : ""}
                    </p>
                  )}
                  <p className="collection-description">{list.description}</p>
                </div>
              )}
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
              aria-pressed={!selectedCategories.length}
              onClick={() => {
                setSelectedCategories([]);
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
                  aria-pressed={selectedCategories.includes(tag)}
                  onClick={() => {
                    setSelectedCategories((current) =>
                      current.includes(tag)
                        ? current.filter((category) => category !== tag)
                        : [...current, tag]
                    );
                    clearSelection();
                  }}
                >
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
                setSelectedCategories([]);
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
          onHover={setHoveredId}
        />
        {detail && (
          <article
            className={`place-detail${hoveredId && hoveredId !== selectedId ? " is-preview" : ""}`}
          >
            <button
              className="detail-close icon-button"
              aria-label="Close place details"
              title="Close place details"
              onClick={() => {
                setSelectedId(null);
                setHoveredId(null);
                updateUrl(collectionId);
              }}
            >
              <X size={16} />
            </button>
            <span className="detail-category">{detail.tags.join(" / ")}</span>
            <h2>{detail.name}</h2>
            <p className="detail-address">{detail.address}</p>
            {detail.note && <p>{detail.note}</p>}
            {detail.visitedOn && (
              <p className="visit-date">
                Visited {formatDate(detail.visitedOn)}
              </p>
            )}
            <div className="detail-links">
              <a href={mapsUrl(detail)} target="_blank" rel="noreferrer">
                Google Maps <ArrowUpRight size={14} />
              </a>
              {detail.post && (
                <Link href={`https://bneo.xyz/posts/${detail.post}`}>
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
