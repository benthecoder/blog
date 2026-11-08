"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { useMounted } from "@/components/ui/ThemeSwitch";
import {
  collectionPlaces,
  mapsUrl,
  readMapSelection,
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

/** A list reads as a page beside a printed map: each place is numbered like
 * a map key, Benedict's note is the entry, and the name is its label. */
export default function PlacesExplorer({
  data,
  intro,
}: {
  data: PlacesData;
  intro: string;
}) {
  const page = useRef<HTMLElement>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // One lit place, whichever side the pointer is on.
  const [litId, setLitId] = useState<string | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const collection = data.collections.find((c) => c.id === collectionId);
  const places = useMemo<Visit[]>(
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
  const dark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    const readUrl = () => {
      const current = readMapSelection(
        data,
        new URLSearchParams(window.location.search)
      );
      setCollectionId(current.collectionId);
      setSelectedId(current.placeId);
      setLitId(null);
    };
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [data]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !selectedId) return;
      setSelectedId(null);
      updateUrl(collectionId, undefined, true);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [selectedId, collectionId]);

  function updateUrl(list: string | null, place?: string, replace = false) {
    const url = new URL(window.location.href);
    if (list) url.searchParams.set("list", list);
    else url.searchParams.delete("list");
    if (place) url.searchParams.set("place", place);
    else url.searchParams.delete("place");
    window.history[replace ? "replaceState" : "pushState"](null, "", url);
  }
  function openList(id: string | null) {
    if (page.current) page.current.scrollTop = 0;
    setCollectionId(id);
    setSelectedId(null);
    setLitId(null);
    updateUrl(id);
  }
  function selectPlace(id: string) {
    const listId =
      collectionId ??
      data.collections.find((list) =>
        list.entries.some((entry) => entry.placeId === id)
      )?.id;
    if (!listId) return;
    const deselect = listId === collectionId && id === selectedId;
    setCollectionId(listId);
    setSelectedId(deselect ? null : id);
    updateUrl(listId, deselect ? undefined : id, deselect);
  }
  // A mark tapped on the map brings its entry into view.
  function selectFromMap(id: string) {
    selectPlace(id);
    requestAnimationFrame(() =>
      document
        .getElementById(`place-${id}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    );
  }
  const listLink = (id: string | null) => ({
    href: id ? `?list=${id}` : "?",
    "aria-current": id === collectionId ? ("page" as const) : undefined,
    onClick: (event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      openList(id);
    },
  });

  return (
    <main className="places-explorer">
      <article ref={page} className="places-page" aria-label="Places">
        <nav className="places-nav" aria-label="Lists">
          <a {...listLink(null)}>Places</a>
          {data.collections.map((list) => (
            <a key={list.id} {...listLink(list.id)}>
              {list.title}
            </a>
          ))}
          <button
            className="places-theme"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Switch to light map" : "Switch to dark map"}
            title={dark ? "Light map" : "Dark map"}
          >
            {mounted && (dark ? <Sun size={15} /> : <Moon size={15} />)}
          </button>
        </nav>
        {collection ? (
          <>
            <h1>{collection.title}</h1>
            {collection.post && (
              <p className="places-lede">
                <a href={`https://bneo.xyz/posts/${collection.post}`}>
                  Read the journal
                </a>
              </p>
            )}
            <ol className="places-key">
              {places.map((place, index) => (
                <li
                  key={place.id}
                  id={`place-${place.id}`}
                  className={place.id === litId ? "is-lit" : undefined}
                >
                  <button
                    className="entry"
                    aria-expanded={place.id === selectedId}
                    aria-controls={`detail-${place.id}`}
                    onClick={() => selectPlace(place.id)}
                    onMouseEnter={() => setLitId(place.id)}
                    onMouseLeave={() => setLitId(null)}
                    onFocus={() => setLitId(place.id)}
                    onBlur={() => setLitId(null)}
                  >
                    <span className="entry-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="entry-note">{place.note}</span>
                    <span className="entry-name">
                      {place.name}
                      {place.visitedOn && <>, {formatDate(place.visitedOn)}</>}
                    </span>
                  </button>
                  {place.id === selectedId && (
                    <div className="entry-detail" id={`detail-${place.id}`}>
                      <p>{place.address}</p>
                      {place.images?.map((image) => (
                        <figure key={image.src}>
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 760px) 90vw, 340px"
                          />
                        </figure>
                      ))}
                      <p className="entry-links">
                        <a
                          href={mapsUrl(place)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Google Maps <ArrowUpRight size={13} />
                        </a>
                        {place.post && (
                          <a href={`https://bneo.xyz/posts/${place.post}`}>
                            Journal <ArrowUpRight size={13} />
                          </a>
                        )}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <>
            <h1>Places</h1>
            <p className="places-lede">{intro}</p>
            <ul className="places-index">
              {data.collections.map((list) => (
                <li key={list.id}>
                  <a {...listLink(list.id)}>{list.title}</a>
                  <p>{list.description}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="places-colophon">
          by <a href="https://bneo.xyz">ben</a>
        </p>
      </article>
      <section className="map-area" aria-label="Places map">
        <PlacesMap
          places={places}
          numbered={Boolean(collection)}
          selectedId={selectedId}
          litId={litId}
          dark={dark}
          onSelect={selectFromMap}
          onHover={setLitId}
        />
      </section>
    </main>
  );
}
