"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowUpRight, Moon, Sun, X } from "lucide-react";
import { useMounted } from "@/components/ui/ThemeSwitch";
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
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [listHoverId, setListHoverId] = useState<string | null>(null);
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
  const usedCategories = categories.filter((tag) =>
    allPlaces.some((p) => p.tags.includes(tag))
  );

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
    setCollectionId(id);
    setSelectedCategories([]);
    setHoveredId(null);
    setQuery("");
    setSelectedId(null);
    updateUrl(id);
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
    updateUrl(listId, id);
    // A pin tapped on the map brings its row into view.
    requestAnimationFrame(() =>
      document
        .getElementById(`place-${id}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    );
  }
  function toggleCategory(tag: Category) {
    setSelectedCategories((current) =>
      current.includes(tag)
        ? current.filter((category) => category !== tag)
        : [...current, tag]
    );
    clearSelection();
  }
  // Plain links still work without JS and with a modifier key.
  const listLink = (id: string | null) => ({
    href: id ? `?list=${id}` : "?",
    "aria-current": id === collectionId ? ("page" as const) : undefined,
    onClick: (event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      selectCollection(id);
    },
  });

  // Map/list layout inspired by CW&T: https://maps.cwandt.com/?list=nyc
  return (
    <main className="places-explorer">
      <aside className="places-page" aria-label="Lists and places">
        <header className="places-masthead">
          <h1>
            <a {...listLink(null)}>Places</a>
          </h1>
          <a className="places-byline" href="https://bneo.xyz">
            by ben
          </a>
          <button
            className="places-theme"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Switch to light map" : "Switch to dark map"}
            title={dark ? "Light map" : "Dark map"}
          >
            {mounted && (dark ? <Sun size={15} /> : <Moon size={15} />)}
          </button>
        </header>

        <section aria-labelledby="lists-label">
          <h2 className="places-label" id="lists-label">
            Lists
          </h2>
          <ul className="places-lists">
            {data.collections.map((list) => (
              <li key={list.id}>
                <a {...listLink(list.id)}>
                  {list.title}
                  <span className="places-count">{list.entries.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* An open list is already named, bold, with its count, just above;
            only the unfiltered view needs its own heading. */}
        <section
          className="places-section"
          aria-label={collection?.title ?? "All places"}
        >
          {!collection && (
            <h2 className="places-label">
              All places
              <span className="places-count">{allPlaces.length}</span>
            </h2>
          )}
          {collection?.post && (
            <p className="places-journal">
              <Link href={`https://bneo.xyz/posts/${collection.post}`}>
                Read the journal
              </Link>
            </p>
          )}
          <div className="places-filters">
            {usedCategories.length > 1 && (
              <div
                className="places-categories"
                role="group"
                aria-label="Filter by kind"
              >
                {usedCategories.map((tag) => (
                  <button
                    key={tag}
                    aria-pressed={selectedCategories.includes(tag)}
                    onClick={() => toggleCategory(tag)}
                  >
                    <CategoryDot category={tag} />
                    {tag}
                    <span className="places-count">
                      {
                        allPlaces.filter((place) => place.tags.includes(tag))
                          .length
                      }
                    </span>
                  </button>
                ))}
              </div>
            )}
            <input
              className="places-search"
              type="search"
              aria-label="Filter places"
              placeholder="Filter"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                clearSelection();
              }}
            />
          </div>

          {groups.map((group) => (
            <Fragment key={group.id}>
              {group.title && <h3 className="place-group">{group.title}</h3>}
              <ul className="place-list">
                {group.places.map((place) => (
                  <li
                    key={place.id}
                    id={`place-${place.id}`}
                    data-category={place.tags[0]}
                    className={
                      place.id === selectedId
                        ? "selected"
                        : place.id === hoveredId
                          ? "is-hovered"
                          : undefined
                    }
                  >
                    <button
                      className="place-select"
                      onClick={() => selectPlace(place.id)}
                      onMouseEnter={() => setListHoverId(place.id)}
                      onMouseLeave={() => setListHoverId(null)}
                      onFocus={() => setListHoverId(place.id)}
                      onBlur={() => setListHoverId(null)}
                      aria-pressed={place.id === selectedId}
                    >
                      <CategoryDot category={place.tags[0]} />
                      <span className="place-name">{place.name}</span>
                      {place.note && (
                        <span className="place-note">{place.note}</span>
                      )}
                      {place.visitedOn && (
                        <span className="visit-date">
                          {formatDate(place.visitedOn)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </Fragment>
          ))}
          {!places.length && (
            <p className="empty-places">
              Nothing matches that.{" "}
              <button
                onClick={() => {
                  setQuery("");
                  setSelectedCategories([]);
                }}
              >
                Show all
              </button>
            </p>
          )}
        </section>
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
                      <span>{formatDate(detail.visitedOn)}</span>
                    )}
                    <button
                      className="detail-close"
                      aria-label="Close place details"
                      title="Close place details"
                      onClick={() => {
                        setSelectedId(null);
                        setHoveredId(null);
                        updateUrl(collectionId);
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <h2>{detail.name}</h2>
                  {detail.note && <p className="detail-note">{detail.note}</p>}
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
                            sizes="(max-width: 760px) 90vw, 280px"
                            priority={index === 0 && detail.id === selectedId}
                          />
                        </figure>
                      ))}
                    </div>
                  ) : null}
                  <p className="detail-links">
                    <a href={mapsUrl(detail)} target="_blank" rel="noreferrer">
                      Google Maps <ArrowUpRight size={13} />
                    </a>
                    {detail.post && (
                      <Link href={`https://bneo.xyz/posts/${detail.post}`}>
                        Journal <ArrowUpRight size={13} />
                      </Link>
                    )}
                  </p>
                </article>
              ),
            }
          }
        />
      </section>
    </main>
  );
}
