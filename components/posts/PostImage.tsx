"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageMeta } from "@/utils/content/imageMeta";

export default function PostImage({
  src,
  alt,
  meta,
}: {
  src: string;
  alt: string;
  meta?: ImageMeta | null;
}) {
  const [loaded, setLoaded] = useState(false);
  // Without a blur placeholder (drafts, unknown images), fall back to the
  // opacity fade so images never pop in abruptly.
  const fadeIn = !meta?.blurDataURL;

  return (
    <figure className="my-1">
      <div className="w-full overflow-hidden rounded-xs">
        <Image
          src={src}
          alt={alt}
          width={meta?.width ?? 800}
          height={meta?.height ?? 600}
          sizes="(max-width: 800px) 100vw, 800px"
          placeholder={meta?.blurDataURL ? "blur" : "empty"}
          blurDataURL={meta?.blurDataURL}
          onLoad={() => setLoaded(true)}
          className={`w-full h-auto ${
            fadeIn
              ? `transition-opacity duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${loaded ? "opacity-100" : "opacity-0"}`
              : ""
          }`}
        />
      </div>
      {alt && (
        <figcaption className="text-center text-japanese-ginnezu dark:text-japanese-ginnezu text-xs mt-1">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}
