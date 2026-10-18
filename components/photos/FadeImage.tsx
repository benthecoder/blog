"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

// Fades in once loaded; also catches images that finished before hydration.
export function FadeImage({ alt, ...props }: ComponentProps<typeof Image>) {
  return (
    <Image
      {...props}
      alt={alt}
      ref={(element) => {
        if (element?.complete) element.dataset.loaded = "";
      }}
      onLoad={(event) => {
        event.currentTarget.dataset.loaded = "";
      }}
    />
  );
}
