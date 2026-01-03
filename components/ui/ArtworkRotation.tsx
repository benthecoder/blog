"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const NameHeader = () => (
  <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
    <div className="flex flex-col items-center gap-3">
      <Link href="/">
        <Image
          src="/icons/ename.svg"
          alt="BENEDICT NEO"
          width={10}
          height={10}
          className="w-28 md:w-36 h-auto dark:invert"
          priority
        />
      </Link>
      <Link href="/about">
        <Image
          src="/icons/cname.svg"
          alt="梁耀恩"
          width={10}
          height={10}
          className="w-20 md:w-24 h-auto dark:invert"
          priority
        />
      </Link>
    </div>
  </div>
);

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
  const [stats, setStats] = useState<{
    totalPosts: number;
    totalWords: number;
    totalDays: number;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SKETCH_PATHS.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) =>
        setStats({
          totalPosts: data.totalPosts,
          totalWords: data.totalWords,
          totalDays: data.totalDays,
        })
      )
      .catch(() => {});
  }, []);

  return (
    <>
      <NameHeader />
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center gap-3 w-full max-w-[min(90vw,400px)]">
          <div className="relative w-full aspect-square">
            <Image
              src={SKETCH_PATHS[currentIndex]}
              alt="sketch"
              fill
              className="object-contain select-none opacity-90"
              priority
              draggable={false}
              sizes="(max-width: 640px) 90vw, 400px"
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            {stats && stats.totalDays > 0 && stats.totalWords > 0 && (
              <div className="text-xs text-japanese-ginnezu dark:text-gray-500">
                {stats.totalDays} days · {stats.totalWords.toLocaleString()}{" "}
                words
              </div>
            )}
            <Link
              href="/posts"
              className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu hover:underline"
            >
              archive
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
