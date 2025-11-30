"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const SKETCH_PATHS = [
  "/images/sunflowersketch.png",
  "/images/handrose.png",
  "/images/peony.png",
  "/images/hummingbird.png",
  "/images/howl.png",
  "/images/hokusai.png",
  "/images/christ.png",
  "/images/metro.png",
  "/images/wave.png",
  "/images/room.png",
  "/images/angel.png",
  "/images/icons.jpg",
  "/images/psalms.png",
] as const;

const ROTATION_INTERVAL = 3000;

export default function ArtworkRotation() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SKETCH_PATHS.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="fixed top-32 md:top-0 bottom-0 left-0 right-0 md:left-64 flex items-center justify-center overflow-hidden z-[-100]">
        <div className="relative w-full h-full max-w-6xl px-8 flex items-center justify-center">
          <div className="relative w-full h-[70vh] select-none">
            <Image
              src={SKETCH_PATHS[currentIndex]}
              alt="sketch"
              fill
              className="object-contain opacity-90"
              priority
              draggable={false}
              sizes="(max-width: 768px) 100vw, 1280px"
            />
          </div>
        </div>
      </div>

      <Link
        href="/about"
        className="fixed bottom-8 right-8 text-sm text-japanese-sumiiro dark:text-japanese-shironezu hover:underline z-10"
      >
        about
      </Link>
    </>
  );
}
