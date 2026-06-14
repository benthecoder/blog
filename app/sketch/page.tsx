"use client";

import { useState } from "react";
import Image from "next/image";
import { DRAWINGS_URL } from "@/config/constants";

const SKETCHES = [
  "handrose.png",
  "sunflowersketch.png",
  "peony.png",
  "hummingbird.png",
  "howl.png",
  "hokusai.png",
  "christ.png",
  "metro.png",
  "wave.png",
  "room.png",
  "angel.png",
].map((f) => `${DRAWINGS_URL}/${f}`);

export default function SketchPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <h1 className="font-bold text-left mb-10 text-2xl">Sketches</h1>
      <p className="mb-5">Drawn with reMarkable 2</p>

      <div className="columns-1 md:columns-2 space-y-1 rounded-md">
        {SKETCHES.map((src) => (
          <div
            key={src}
            className="break-inside-avoid mb-0 cursor-crosshair"
            onClick={() => setSelected(src)}
          >
            <Image src={src} alt={src} width={1000} height={200} />
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/75 flex justify-center items-center z-50"
          onClick={() => setSelected(null)}
        >
          <div className="relative w-full h-full max-w-4xl max-h-[90vh] m-4">
            <Image
              src={selected}
              alt="Selected sketch"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
