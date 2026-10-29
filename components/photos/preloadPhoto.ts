import { getImageProps } from "next/image";

// Warm the browser cache with the exact candidate a full-bleed <Image> picks.
export function preloadPhoto(src: string, quality: number) {
  const { props } = getImageProps({
    src,
    alt: "",
    fill: true,
    sizes: "100vw",
    quality,
  });
  const image = new window.Image();
  image.sizes = "100vw";
  image.srcset = props.srcSet ?? "";
  image.src = props.src;
}
