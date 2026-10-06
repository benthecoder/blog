"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DRAWINGS_URL } from "@/config/constants";
import {
  GARDEN_LIMIT,
  gardenPosition,
  readGarden,
  type GardenPlant,
} from "@/utils/garden";

const STORAGE_KEY = "drawn-garden-v1";

export default function Garden() {
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [cursor, setCursor] = useState({ x: 50, y: 76 });
  const [keyboard, setKeyboard] = useState(false);
  const [newest, setNewest] = useState<string | null>(null);
  const [artworkReady, setArtworkReady] = useState(false);
  const [artworkError, setArtworkError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);

  // Storage is optional and is read after hydration so server/client markup agrees.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setPlants(readGarden(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [plants, ready]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const plant = (x: number, y: number) => {
    if (!ready || !artworkReady || plants.length >= GARDEN_LIMIT) return;
    const id = crypto.randomUUID();
    setNewest(id);
    setPlants((previous) =>
      previous.length >= GARDEN_LIMIT
        ? previous
        : [
            ...previous,
            {
              id,
              ...gardenPosition(x, y),
              tilt: Math.random() * 14 - 7,
              size: 0.85 + Math.random() * 0.3,
            },
          ]
    );
  };

  return (
    <section aria-label="Drawn garden">
      <Image
        key={imageAttempt}
        src={`${DRAWINGS_URL}/peony.png`}
        alt=""
        aria-hidden="true"
        width={160}
        height={213}
        sizes="160px"
        loading="eager"
        className="sr-only"
        onLoad={() => {
          setArtworkReady(true);
          setArtworkError(false);
        }}
        onError={() => setArtworkError(true)}
      />
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <p
          id="garden-instructions"
          className="text-sm text-ink-soft dark:text-chalk-muted"
        >
          click to plant a peony
        </p>
        <button
          type="button"
          disabled={!plants.length}
          onClick={() => setPlants((previous) => previous.slice(0, -1))}
          className="min-h-11 px-2 text-sm underline underline-offset-4 text-ink dark:text-chalk disabled:opacity-30 focus-visible:outline focus-visible:outline-offset-4"
        >
          undo
        </button>
      </div>
      <button
        type="button"
        className="garden-plot relative block w-full h-[min(60vh,480px)] min-h-80 overflow-hidden cursor-crosshair border-b border-rule dark:border-night-rule focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink dark:focus-visible:outline-chalk"
        aria-label="Plant a peony"
        aria-describedby="garden-instructions garden-keyboard"
        disabled={!ready || !artworkReady}
        aria-busy={!artworkReady && !artworkError}
        onClick={(event) => {
          if (event.detail === 0) {
            plant(cursor.x, cursor.y);
            return;
          }
          const bounds = event.currentTarget.getBoundingClientRect();
          setKeyboard(false);
          plant(
            ((event.clientX - bounds.left) / bounds.width) * 100,
            ((event.clientY - bounds.top) / bounds.height) * 100
          );
        }}
        onKeyDown={(event) => {
          const movements: Record<string, [number, number]> = {
            ArrowLeft: [-4, 0],
            ArrowRight: [4, 0],
            ArrowUp: [0, -4],
            ArrowDown: [0, 4],
          };
          const delta = movements[event.key];
          if (!delta) return;
          event.preventDefault();
          setKeyboard(true);
          setCursor((previous) =>
            gardenPosition(previous.x + delta[0], previous.y + delta[1])
          );
        }}
        onFocus={() => setKeyboard(true)}
        onBlur={() => setKeyboard(false)}
      >
        {[...plants]
          .sort((a, b) => a.y - b.y)
          .map((item) => (
            <span
              key={item.id}
              aria-hidden="true"
              className="garden-plant pointer-events-none absolute"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -100%) rotate(${item.tilt}deg)`,
                width: `calc(clamp(92px, 17vw, 156px) * ${item.size})`,
              }}
            >
              <span
                className={`garden-bloom block ${newest === item.id ? "garden-bloom-new" : ""}`}
              >
                <span className="garden-cutout relative block overflow-hidden aspect-[1404/1590]">
                  <Image
                    src={`${DRAWINGS_URL}/peony.png`}
                    alt=""
                    fill
                    sizes="160px"
                    draggable={false}
                    className="garden-drawing select-none"
                  />
                </span>
              </span>
            </span>
          ))}
        {keyboard && (
          <span
            aria-hidden="true"
            className="absolute pointer-events-none text-ink dark:text-chalk text-lg leading-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
          >
            +
          </span>
        )}
      </button>
      {artworkError && (
        <p role="alert" className="mt-4 text-sm">
          The drawing couldn’t load.{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => {
              setArtworkError(false);
              setImageAttempt((previous) => previous + 1);
            }}
          >
            retry
          </button>
        </p>
      )}
      {!artworkReady && !artworkError && (
        <p role="status" className="mt-4 text-sm">
          loading the drawing…
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-ink-soft dark:text-chalk-muted">
        <p id="garden-keyboard">arrows to move · enter to plant</p>
        <p role="status" aria-live="polite">
          {plants.length === GARDEN_LIMIT
            ? "garden full · undo to make room"
            : `${plants.length} ${plants.length === 1 ? "peony" : "peonies"}`}{" "}
          · {saved ? "kept in this browser" : "for this visit only"}
        </p>
      </div>
    </section>
  );
}
