"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { DRAWINGS_URL } from "@/config/constants";
import { SketchIcon, ENAME_RATIO, CNAME_RATIO } from "./SketchIcon";

const NameHeader = () => (
  <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
    <div className="flex flex-col items-center gap-3">
      <Link href="/">
        <SketchIcon
          src="/icons/ename.svg"
          label="BENEDICT NEO"
          className="w-28 md:w-36"
          style={{ aspectRatio: ENAME_RATIO }}
        />
      </Link>
      <Link href="/about">
        <SketchIcon
          src="/icons/cname.svg"
          label="梁耀恩"
          className="w-20 md:w-24"
          style={{ aspectRatio: CNAME_RATIO }}
        />
      </Link>
    </div>
  </div>
);

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

const INTERVAL = 1000;

function altOf(index: number) {
  return (
    SKETCHES[index].replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") + " sketch"
  );
}

type Layer = { index: number; id: number };

export default function ArtworkRotation() {
  // `current` is on screen; `pending` is the next drawing, mounted invisible
  // only so the browser fetches and decodes it. Ids are monotonic, so a slow
  // decode that resolves after it has been superseded is simply ignored.
  const [current, setCurrent] = useState<Layer>({ index: 0, id: 0 });
  const [pending, setPending] = useState<Layer | null>(null);
  const [paused, setPaused] = useState(false);
  const currentId = useRef(0);

  useEffect(() => {
    if (paused) return;
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

  // Promote only once the pixels are paintable — onLoad means fetched, not
  // decoded, and cutting to a not-yet-decoded image flashes blank. Both
  // layers keep their key across the promotion, so React reuses the same
  // node and the cut costs one attribute flip.
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
    <>
      <NameHeader />
      <div className="h-screen w-full flex flex-col items-center justify-center pt-10 px-4 md:px-8 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 md:gap-6 w-full max-w-[min(85vw,700px)] md:max-w-[min(60vw,600px)]">
          <Link
            href="/sketch"
            className="relative w-full aspect-square max-h-[calc(100vh-320px)] md:max-h-[calc(100vh-280px)] cursor-pointer"
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
          >
            {/* opacity-90 sits on the wrapper, not the layers, so the
                pending layer can't add its own alpha on top of the current
                one while both are mounted. */}
            <div className="absolute inset-0 opacity-90">
              {[current, pending].map((layer) =>
                layer ? (
                  <Image
                    key={layer.id}
                    src={SKETCH_PATHS[layer.index]}
                    alt={layer.id === current.id ? altOf(layer.index) : ""}
                    aria-hidden={layer.id !== current.id}
                    fill
                    className="artwork-layer object-contain select-none"
                    data-shown={layer.id === current.id ? "true" : "false"}
                    onLoad={(e) => promote(layer, e.currentTarget)}
                    priority={layer.id === 0}
                    draggable={false}
                    sizes="(max-width: 768px) 85vw, 60vw"
                  />
                ) : null
              )}
            </div>
          </Link>

          <div className="flex flex-col items-center gap-2 pb-2">
            <Link
              href="/start"
              className="text-sm text-ink dark:text-chalk hover:underline"
            >
              start here
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
