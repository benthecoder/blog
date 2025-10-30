import { Metadata } from "next";
import { getGalleryImages } from "@/utils/getGalleryImages";
import Gallery from "@/components/Gallery";

export const metadata: Metadata = {
  title: "gallery",
  description: "a collection of artworks and images",
};

export default function GalleryPage() {
  const images = getGalleryImages();

  return <Gallery images={images} />;
}
