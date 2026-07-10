"use client";

import { useState } from "react";
import Image from "next/image";
import { DRAWINGS_URL } from "@/config/constants";

const SKETCHES = [
  { file: "handrose.png", label: "hand rose pencil sketch" },
  { file: "sunflowersketch.png", label: "sunflower pencil sketch" },
  { file: "peony.png", label: "peony pencil sketch" },
  { file: "hummingbird.png", label: "hummingbird pencil sketch" },
  { file: "howl.png", label: "howl's moving castle sketch" },
  { file: "hokusai.png", label: "hokusai wave ink sketch" },
  { file: "christ.png", label: "christ sketch" },
  { file: "metro.png", label: "metro scene sketch" },
  { file: "wave.png", label: "wave sketch" },
  { file: "room.png", label: "room interior sketch" },
  { file: "angel.png", label: "angel sketch" },
].map(({ file, label }) => ({ src: `${DRAWINGS_URL}/${file}`, label }));

export default function SketchPage() {
  const [selected, setSelected] = useState<(typeof SKETCHES)[number] | null>(
    null
  );

  return (
    <div>
      <h1 className="font-bold text-left mb-10 text-2xl">Sketches</h1>
      <p className="mb-5">Drawn with reMarkable 2</p>

      <div className="columns-1 md:columns-2 space-y-1 rounded-md">
        {SKETCHES.map((sketch) => (
          <button
            key={sketch.src}
            className="break-inside-avoid mb-0 cursor-crosshair w-full text-left"
            onClick={() => setSelected(sketch)}
          >
            <Image
              src={sketch.src}
              alt={sketch.label}
              width={1000}
              height={200}
            />
          </button>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.label}
          className="fixed inset-0 bg-black/75 flex justify-center items-center z-50"
          onClick={() => setSelected(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelected(null);
          }}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[90vh] m-4">
            <Image
              src={selected.src}
              alt={selected.label}
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
