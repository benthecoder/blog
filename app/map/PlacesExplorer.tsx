"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowUpRight, ChevronDown, List, X } from "lucide-react";
import { useMounted } from "@/components/ui/ThemeSwitch";
import CategoryDot from "./CategoryDot";
import {
  categories,
  collectionPlaces,
  filterPlaces,
  gridReference,
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
  const [listHoverId, setListHoverId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
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
  // Without a selected list, group rows under the first list that has them.
  const groups = useMemo(() => {
    if (collection) return [{ id: "", title: "", places }];
    const claimed = new Set<string>();
    return data.collections
      .map((list) => {
        const rows = places.filter(
          (place) =>
            !claimed.has(place.id) &&
            list.entries.some((entry) => entry.placeId === place.id)
        );
        rows.forEach((place) => claimed.add(place.id));
        return { id: list.id, title: list.title, places: rows };
      })
      .filter((group) => group.places.length);
  }, [data, collection, places]);
  const detail = places.find((p) => p.id === hoveredId) ?? selected;
  const stationOf = useMemo(
    () => new Map(places.map((place, index) => [place.id, index + 1])),
    [places]
  );
  const sheetLine = `Field map · ${collection?.location ?? "All sheets"} · rev. ${new Date(
    `${data.updated}T12:00:00Z`
  ).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}`;

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (hoveredId) {
        setHoveredId(null);
        return;
      }
      if (event.target instanceof HTMLInputElement && event.target.value) {
        setQuery("");
        clearSelection();
        return;
      }
      if (selectedId) {
        setSelectedId(null);
        updateUrl(collectionId);
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredId, selectedId, collectionId]);

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

  // Map/list layout inspired by CW&T: https://maps.cwandt.com/?list=nyc
  return (
    <main className="places-explorer">
      <header className="map-header">
        <div className="map-brand">
          <div className="map-brand-text">
            <h1 className="map-wordmark">PLACES</h1>
            <span className="sheet-line">{sheetLine}</span>
          </div>
          <span>
            <a href="https://bneo.xyz">by ben</a>
          </span>
        </div>
        <div className="map-theme" role="group" aria-label="Map appearance">
          <button
            aria-pressed={mounted && resolvedTheme !== "dark"}
            onClick={() => setTheme("light")}
          >
            Light
          </button>
          <button
            aria-pressed={mounted && resolvedTheme === "dark"}
            onClick={() => setTheme("dark")}
          >
            Dark
          </button>
        </div>
      </header>
      <aside
        ref={panel}
        id="places-panel"
        className={`places-panel${sheetOpen ? " is-open" : ""}`}
        aria-label="Lists and places"
      >
        <div className="panel-section-heading">
          <h2>Sheets</h2>
          <span>{data.collections.length}</span>
        </div>
        <ul className="collection-list" aria-label="Saved sheets">
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
            </li>
          ))}
        </ul>
        <div className="panel-section-heading places-section-heading">
          <h2>Index</h2>
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
          <div className="place-search">
            <input
              type="search"
              aria-label="Filter places"
              placeholder="Filter"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                clearSelection();
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                onClick={() => {
                  setQuery("");
                  clearSelection();
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
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
                  <CategoryDot category={tag} />
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
        {groups.map((group) => (
          <Fragment key={group.id}>
            {group.title && <h3 className="place-group">{group.title}</h3>}
            <ul className="place-list">
              {group.places.map((place) => (
                <li
                  key={place.id}
                  className={
                    place.id === selectedId
                      ? "selected"
                      : place.id === hoveredId
                        ? "is-hovered"
                        : ""
                  }
                >
                  <button
                    className="place-select"
                    onClick={() => selectPlace(place.id)}
                    onMouseEnter={() => setListHoverId(place.id)}
                    onMouseLeave={() => setListHoverId(null)}
                    onFocus={() => setListHoverId(place.id)}
                    onBlur={() => setListHoverId(null)}
                    aria-label={`Show ${place.name} on map`}
                    aria-pressed={place.id === selectedId}
                  >
                    <span className="place-station" aria-hidden="true">
                      {stationOf.get(place.id)}
                    </span>
                    <span className="place-copy">
                      <span className="place-line">
                        <span className="place-name">{place.name}</span>
                        <span className="place-leader" aria-hidden="true" />
                        <span className="place-ref">
                          {gridReference(place, allPlaces)}
                        </span>
                      </span>
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
          </Fragment>
        ))}
        {!places.length && (
          <div className="empty-places">
            <p>Nothing matches that.</p>
          </div>
        )}
        <div className="map-legend">
          <h2>Legend</h2>
          <p>
            <span className="legend-station" aria-hidden="true">
              4
            </span>
            station — its number matches the index and the map
          </p>
          <p>
            <span className="legend-ring" aria-hidden="true" />
            ring colour — the kind of place, as in the filters above
          </p>
          <p>
            <span className="legend-stamp" aria-hidden="true">
              Surveyed
            </span>
            stamped on a card once it has been visited
          </p>
          <p className="legend-note">
            Grid references (B2) place a station on this sheet: columns
            west to east, rows north to south.
          </p>
        </div>
      </aside>
      <section className="map-area" aria-label="Places map">
        <PlacesMap
          places={places}
          selected={selected}
          highlightId={listHoverId}
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
            <div className="detail-categories">
              {detail.tags.map((tag) => (
                <span className="detail-category" key={tag}>
                  <CategoryDot category={tag} />
                  {tag}
                </span>
              ))}
            </div>
            <h2>{detail.name}</h2>
            <p className="detail-address">{detail.address}</p>
            {detail.note && <p>{detail.note}</p>}
            {detail.visitedOn && (
              <p className="visit-stamp">
                Surveyed {formatDate(detail.visitedOn)}
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
            {collection?.title ?? "Sheets"}
            <span>{collection ? places.length : data.collections.length}</span>
          </>
        )}
      </button>
    </main>
  );
}
