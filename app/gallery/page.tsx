import { Metadata } from "next";
import { getGalleryImages } from "@/utils/getGalleryImages";
import Gallery from "@/components/visualizations/Gallery";

export const metadata: Metadata = {
  title: "gallery",
  description: "a collection of artworks and images",
};

export const dynamic = "force-static";

export default function GalleryPage() {
  const images = getGalleryImages();

  return <Gallery images={images} />;
}
