"use client";

import { useEffect, useState } from "react";

interface Dot {
  x: number;
  y: number;
  opacity: number;
}

export default function UMAPLoader({ className = "" }: { className?: string }) {
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    // Generate initial random dots - more dense to mimic actual map
    const initialDots = Array.from({ length: 180 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.7 + 0.15,
    }));
    setDots(initialDots);

    // Randomly update opacities to create flashing effect
    const interval = setInterval(() => {
      setDots((prev) =>
        prev.map((dot) => ({
          ...dot,
          opacity: Math.random() * 0.7 + 0.15,
        }))
      );
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative ${className} bg-japanese-kinairo dark:bg-dark-bg`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    >
      {/* Random flashing dots */}
      <svg className="w-full h-full absolute inset-0">
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={`${dot.x}%`}
            cy={`${dot.y}%`}
            r="3"
            className="fill-japanese-sumiiro dark:fill-japanese-shironezu transition-opacity duration-200"
            style={{ opacity: dot.opacity }}
          />
        ))}
      </svg>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-japanese-kinairo/90 dark:bg-dark-bg/90 px-3 py-1 rounded border border-japanese-shiraumenezu dark:border-dark-border text-xs text-japanese-ginnezu dark:text-japanese-ginnezu">
        loading knowledge map...
      </div>
    </div>
  );
}
