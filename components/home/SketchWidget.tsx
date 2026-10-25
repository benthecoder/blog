"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DRAWINGS_URL } from "@/config/constants";

const SKETCHES = [
  "sunflowersketch.png",
  "handrose.png",
  "peony.png",
  "hummingbird.png",
  "howl.png",
  "hokusai.png",
  "christ.png",
  "metro.png",
  "wave.png",
  "room.png",
  "angel.png",
  "icons.jpg",
  "psalms.png",
] as const;

const SKETCH_PATHS = SKETCHES.map((f) => `${DRAWINGS_URL}/${f}`);

// A page turn, not a flipbook: e-ink redraws rarely, so the drawing changes
// every few seconds with a hard cut and no fade.
const INTERVAL = 6000;

function altOf(index: number) {
  return (
    SKETCHES[index].replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") + " sketch"
  );
}

type Layer = { index: number; id: number };

export function SketchWidget() {
  // `current` is on screen; `pending` is the next drawing, mounted invisible
  // so the browser fetches and decodes it before the cut. Ids are monotonic,
  // so a slow decode that resolves after it's been superseded is ignored.
  const [current, setCurrent] = useState<Layer>({ index: 0, id: 0 });
  const [pending, setPending] = useState<Layer | null>(null);
  const [paused, setPaused] = useState(false);
  const currentId = useRef(0);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setCurrent((shown) => {
        setPending({
          index: (shown.index + 1) % SKETCH_PATHS.length,
          id: shown.id + 1,
        });
        return shown;
      });
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

  const promote = (layer: Layer, img: HTMLImageElement) => {
    const swap = () => {
      if (layer.id <= currentId.current) return;
      currentId.current = layer.id;
      setCurrent(layer);
      setPending((p) => (p && p.id === layer.id ? null : p));
    };
    img.decode().then(swap, swap);
  };

  return (
    <Link
      href="/sketch"
      data-app=""
      aria-label="sketch"
      className="eink-tile eink-widget"
      prefetch={false}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="eink-widget-frame">
        {[current, pending].map((layer) =>
          layer ? (
            <Image
              key={layer.id}
              src={SKETCH_PATHS[layer.index]}
              alt={layer.id === current.id ? altOf(layer.index) : ""}
              title={layer.id === current.id ? altOf(layer.index) : undefined}
              aria-hidden={layer.id !== current.id}
              fill
              className="artwork-layer object-contain select-none p-2"
              data-shown={layer.id === current.id ? "true" : "false"}
              onLoad={(e) => promote(layer, e.currentTarget)}
              priority={layer.id === 0}
              loading="eager"
              draggable={false}
              sizes="(max-width: 768px) 45vw, 200px"
            />
          ) : null
        )}
        <span className="eink-widget-page" aria-hidden="true">
          {current.index + 1}/{SKETCH_PATHS.length}
        </span>
      </span>
      <span className="eink-label" aria-hidden="true">
        sketch
      </span>
    </Link>
  );
}
