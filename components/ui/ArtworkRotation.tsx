"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
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

const INTERVAL = 4000;

export default function ArtworkRotation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SKETCH_PATHS.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <NameHeader />
      <div className="h-screen w-full flex flex-col items-center justify-center pt-10 px-4 md:px-8 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 md:gap-6 w-full max-w-[min(85vw,700px)] md:max-w-[min(60vw,600px)]">
          <Link
            href="/sketch"
            className="relative w-full aspect-square max-h-[calc(100vh-320px)] md:max-h-[calc(100vh-280px)] cursor-pointer"
          >
            <Image
              key={currentIndex}
              src={SKETCH_PATHS[currentIndex]}
              alt={
                SKETCHES[currentIndex]
                  .replace(/\.[^.]+$/, "")
                  .replace(/[-_]/g, " ") + " sketch"
              }
              fill
              className="object-contain select-none"
              style={{
                animation:
                  "artworkFadeIn 800ms cubic-bezier(0.23,1,0.32,1) forwards",
              }}
              priority
              draggable={false}
              sizes="(max-width: 768px) 85vw, 60vw"
            />
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
