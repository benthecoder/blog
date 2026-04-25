"use client";

import Image from "next/image";
import { useState } from "react";

export default function PostImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="my-1">
      {/* Fixed 4:3 container — never changes size regardless of image dimensions.
          Portrait images get space on the sides, landscape fits naturally. */}
      <div className="relative w-full overflow-hidden rounded-sm aspect-[4/3]">
        <div
          className="absolute inset-0 bg-japanese-soshoku/20 dark:bg-white/[0.04]"
          style={{
            opacity: loaded ? 0 : 1,
            transition: "opacity 400ms cubic-bezier(0.23,1,0.32,1)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 800px) 100vw, 800px"
          onLoad={() => setLoaded(true)}
          style={{
            objectFit: "contain",
            opacity: loaded ? 1 : 0,
            transition: "opacity 500ms cubic-bezier(0.23,1,0.32,1)",
          }}
        />
      </div>
      {alt && (
        <figcaption className="text-center text-gray-400 text-xs mt-1">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}
