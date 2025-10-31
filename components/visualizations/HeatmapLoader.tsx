"use client";

import { useEffect, useState } from "react";

export default function HeatmapLoader() {
  const [flashingCells, setFlashingCells] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly flash 10-20 cells
      const numCells = Math.floor(Math.random() * 10) + 10;
      const cells = new Set<number>();
      for (let i = 0; i < numCells; i++) {
        cells.add(Math.floor(Math.random() * 364));
      }
      setFlashingCells(cells);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-12 bg-japanese-shiraumenezu/30 dark:bg-gray-800/30 rounded"></div>
        <div className="h-4 w-12 bg-japanese-shiraumenezu/30 dark:bg-gray-800/30 rounded"></div>
        <div className="h-4 w-12 bg-japanese-shiraumenezu/30 dark:bg-gray-800/30 rounded"></div>
      </div>

      <div className="flex gap-2 mb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] pt-[16px] text-[11px] text-japanese-nezumiiro/40 dark:text-japanese-ginnezu/40">
          {["s", "m", "t", "w", "t", "f", "s"].map((day, i) => (
            <div key={i} className="h-[11px] w-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid with random flashing */}
        <div className="flex-1">
          <div className="h-[14px] mb-1"></div>
          <div className="grid grid-cols-52 gap-[2px]">
            {Array.from({ length: 364 }).map((_, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded-[1px] transition-all duration-150 ${
                  flashingCells.has(i)
                    ? "bg-japanese-sumiiro/40 dark:bg-japanese-shironezu/40"
                    : "bg-japanese-shiraumenezu/20 dark:bg-gray-800/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="border-t border-japanese-shiraumenezu dark:border-gray-800 pt-2">
        <div className="h-3 w-32 bg-japanese-shiraumenezu/20 dark:bg-gray-800/20 rounded"></div>
      </div>
    </div>
  );
}
