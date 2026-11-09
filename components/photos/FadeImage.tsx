"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

// Fades in once loaded; also catches images that finished before hydration.
// A blur placeholder already covers the wait, so those images show from the
// server HTML instead of staying hidden until hydration sets data-loaded.
export function FadeImage({ alt, ...props }: ComponentProps<typeof Image>) {
  return (
    <Image
      {...props}
      alt={alt}
      data-loaded={props.placeholder === "blur" ? "" : undefined}
      ref={(element) => {
        if (element?.complete) element.dataset.loaded = "";
      }}
      onLoad={(event) => {
        event.currentTarget.dataset.loaded = "";
      }}
    />
  );
}
