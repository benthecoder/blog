"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowUpRight, ChevronDown, List, Moon, Sun, X } from "lucide-react";
import { useMounted } from "@/components/ui/ThemeSwitch";
import { Chip } from "@/components/ui/Chip";
import CategoryDot from "./CategoryDot";
import {
  categories,
  collectionPlaces,
  filterPlaces,
  groupPlaces,
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
  const [sheetOpen, setSheetOpen] = useState(false);
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
  const groups = useMemo(
    () => groupPlaces(data, collection, places),
    [data, collection, places]
  );
  const dark = mounted && resolvedTheme === "dark";
  const detail = places.find((p) => p.id === hoveredId) ?? selected;

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
    // A fresh visit lands on the map; the sheet stays one tap away. Going
    // back to the index from a list reopens it, since that's where you were.
    const readUrl = (event?: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const current = readMapSelection(data, params);
      setCollectionId(current.collectionId);
      setSelectedId(current.placeId);
      setSheetOpen(Boolean(event) && !current.collectionId);
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
          <h1 className="map-wordmark">Places</h1>
          <a href="https://bneo.xyz">by ben</a>
        </div>
        {/* The version is the data's last update, so it moves with the list. */}
        <span
          className="map-version"
          title={`Updated ${formatDate(data.updated)}`}
        >
          v{data.updated.replaceAll("-", ".")}
        </span>
        <button
          className="map-theme icon-button"
          onClick={() => setTheme(dark ? "light" : "dark")}
          aria-label={dark ? "Switch to light map" : "Switch to dark map"}
          title={dark ? "Light map" : "Dark map"}
        >
          {mounted && (dark ? <Sun size={14} /> : <Moon size={14} />)}
        </button>
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
        <div
          className="collection-list"
          role="radiogroup"
          aria-label="Saved lists"
        >
          {data.collections.map((list) => (
            <label key={list.id} className="collection-option">
              <input
                type="radio"
                name="map-list"
                checked={collectionId === list.id}
                onChange={() => selectCollection(list.id)}
              />
              <span className="collection-title">{list.title}</span>
              <span className="collection-count">{list.entries.length}</span>
            </label>
          ))}
        </div>
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
              Read the journal <ArrowUpRight size={12} />
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
            <Chip
              pressed={!selectedCategories.length}
              count={allPlaces.length}
              onClick={() => {
                setSelectedCategories([]);
                clearSelection();
              }}
            >
              all
            </Chip>
            {categories
              .filter((tag) => allPlaces.some((p) => p.tags.includes(tag)))
              .map((tag) => (
                <Chip
                  key={tag}
                  pressed={selectedCategories.includes(tag)}
                  count={
                    allPlaces.filter((place) => place.tags.includes(tag)).length
                  }
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
                  {tag}
                </Chip>
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
                  data-category={place.tags[0]}
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
                    <span className="place-copy">
                      <span className="place-name">
                        <CategoryDot category={place.tags[0]} />
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
      </aside>
      <section className="map-area" aria-label="Places map">
        <PlacesMap
          places={places}
          selected={selected}
          highlightId={listHoverId}
          dark={dark}
          onSelect={selectPlace}
          onHover={setHoveredId}
          popup={
            detail && {
              coordinates: detail.coordinates,
              content: (
                <article
                  className={`place-detail${hoveredId && hoveredId !== selectedId ? " is-preview" : ""}`}
                >
                  <div className="detail-meta">
                    {detail.tags.map((tag) => (
                      <span className="detail-category" key={tag}>
                        <CategoryDot category={tag} />
                        {tag}
                      </span>
                    ))}
                    {detail.visitedOn && (
                      <span>Visited {formatDate(detail.visitedOn)}</span>
                    )}
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
                      <X size={14} />
                    </button>
                  </div>
                  <h2>{detail.name}</h2>
                  <p className="detail-address">{detail.address}</p>
                  {detail.images?.length ? (
                    <div
                      className="detail-images"
                      data-count={detail.images.length}
                    >
                      {detail.images.map((image, index) => (
                        <figure key={image.src}>
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 760px) 90vw, 260px"
                            priority={index === 0 && detail.id === selectedId}
                          />
                        </figure>
                      ))}
                    </div>
                  ) : null}
                  {detail.note && <p className="detail-note">{detail.note}</p>}
                  <div className="detail-links">
                    <a href={mapsUrl(detail)} target="_blank" rel="noreferrer">
                      Google Maps <ArrowUpRight size={12} />
                    </a>
                    {detail.post && (
                      <Link href={`https://bneo.xyz/posts/${detail.post}`}>
                        Journal <ArrowUpRight size={12} />
                      </Link>
                    )}
                  </div>
                </article>
              ),
            }
          }
        />
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
