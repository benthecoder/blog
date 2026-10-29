import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { PhotoNav } from "@/components/photos/PhotoNav";
import { PhotoUpdates } from "@/components/photos/PhotoUpdates";
import { getPhotostream } from "@/utils/content/photostream";
import { shortCamera } from "@/utils/photoCamera";
import { placeTree } from "@/utils/photoPlaces";
import "./photos.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-photo-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-photo-mono" });

const count = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export default async function PhotosLayout({
  children,
}: {
  children: ReactNode;
}) {
  const photos = await getPhotostream();
  const places = placeTree(photos);
  const cameras = new Set(photos.map((p) => shortCamera(p.camera)));
  cameras.delete(undefined);
  const cityCount = places.reduce((sum, c) => sum + c.cities.length, 0);
  const summary = [
    count(photos.length, "frame"),
    places.length > 0 && count(places.length, "country", "countries"),
    cityCount > 0 && count(cityCount, "city", "cities"),
    cameras.size > 0 && count(cameras.size, "camera"),
  ].filter(Boolean);
  return (
    <div className={`photo-site ${sans.variable} ${mono.variable}`}>
      <PhotoUpdates />
      <header className="photo-bar">
        <p className="photo-summary">
          {summary.map((part, i) => (
            <span key={i}>
              {i > 0 && " · "}
              {part}
            </span>
          ))}
        </p>
        <PhotoNav />
      </header>
      {children}
    </div>
  );
}
