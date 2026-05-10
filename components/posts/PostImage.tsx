"use client";

import Image from "next/image";
import { useState } from "react";

export default function PostImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="my-1">
      <div className="w-full overflow-hidden rounded-sm">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={600}
          sizes="(max-width: 800px) 100vw, 800px"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "auto",
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
