'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const SKETCH_PATHS = [
  '/images/sunflowersketch.png',
  '/images/handrose.png',
  '/images/peony.png',
  '/images/hummingbird.png',
  '/images/howl.png',
  '/images/hokusai.png',
  '/images/christ.png',
  '/images/metro.png',
  '/images/wave.png',
  '/images/room.png',
  '/images/angel.png',
] as const;

const ROTATION_INTERVAL = 3000;

const HomePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Rotate sketches
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SKETCH_PATHS.length);
    }, ROTATION_INTERVAL);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 md:left-64 flex flex-col items-center justify-center overflow-hidden">
      {/* Image container */}
      <div className="w-full max-w-6xl px-8 py-16">
        <div className="relative w-full h-[75vh] select-none">
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

      {/* About link */}
      <Link
        href="/about"
        className="absolute bottom-8 right-8 text-sm text-japanese-sumiiro dark:text-japanese-shironezu hover:underline"
      >
        about
      </Link>
    </div>
  );
};

export default HomePage;
