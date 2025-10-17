'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const HomePage = () => {
  const sketches = [
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
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // disable scroll on mount
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.height = '100vh';
    body.style.height = '100vh';

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % sketches.length);
    }, 5000);

    return () => {
      clearInterval(timer);
      // re-enable scroll on unmount
      html.style.overflow = '';
      body.style.overflow = '';
      html.style.height = '';
      body.style.height = '';
    };
  }, [sketches.length]);

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
        }
      `}</style>

      <div className="fixed inset-0 -mx-2 -mt-10 md:-mx-10 md:-mt-10 md:ml-0 flex items-center justify-center overflow-hidden z-0">
        <Link
          href="/about"
          className="fixed bottom-8 right-8 text-sm text-japanese-sumiiro dark:text-japanese-shironezu hover:underline z-50"
        >
          about
        </Link>

        <div className="relative w-full h-full max-w-6xl md:ml-48 select-none pointer-events-none">
          <Image
            src={sketches[current]}
            alt="sketch"
            fill
            className="object-contain p-8 md:p-16 opacity-90"
            priority
            draggable={false}
          />
        </div>
      </div>
    </>
  );
};

export default HomePage;
