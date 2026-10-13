import type { Metadata } from "next";
import { PhotoStream } from "@/components/photos/PhotoStream";
import { getPhotostream } from "@/utils/content/photostream";
import { shortCamera } from "@/utils/photoCamera";
import { placeTree } from "@/utils/photoPlaces";

export const metadata: Metadata = {
  title: "photos",
  description: "Every photo, by month.",
  alternates: { canonical: "https://photos.bneo.xyz" },
  openGraph: { title: "photos", url: "https://photos.bneo.xyz" },
};

const count = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ camera?: string }>;
}) {
  const [{ camera }, photos] = await Promise.all([
    searchParams,
    getPhotostream(),
  ]);
  const places = placeTree(photos);
  const cameras = new Set(photos.map((p) => shortCamera(p.camera)));
  cameras.delete(undefined);
  const cityCount = places.reduce((sum, c) => sum + c.cities.length, 0);
  const summary = [
    count(photos.length, "frame"),
    places.length > 0 && count(places.length, "country", "countries"),
    cityCount > 0 && count(cityCount, "city", "cities"),
    cameras.size > 0 && count(cameras.size, "camera"),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <PhotoStream photos={photos} initialCamera={camera} summary={summary} />
  );
}
