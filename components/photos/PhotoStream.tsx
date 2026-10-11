"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { StreamPhoto } from "@/types/photostream";
import { PhotoGrid } from "./PhotoGrid";

export function PhotoStream({ photos }: { photos: StreamPhoto[] }) {
  const [camera, setCamera] = useState("");
  const cameras = [
    ...new Set(photos.flatMap((photo) => (photo.camera ? [photo.camera] : []))),
  ].sort();
  const filtered = camera
    ? photos.filter((photo) => photo.camera === camera)
    : photos;
  return (
    <main className="photo-stream-page">
      <header className="photo-stream-heading">
        <Link href="/photos" aria-label="Back to photos">
          <ArrowLeft size={17} />
        </Link>
        <h1>Photostream</h1>
        {cameras.length > 0 ? (
          <select
            aria-label="Filter by camera"
            value={camera}
            onChange={(event) => setCamera(event.target.value)}
          >
            <option value="">All cameras</option>
            {cameras.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          <span>{photos.length} photos</span>
        )}
      </header>
      <PhotoGrid key={camera} photos={filtered} mode="grid" />
    </main>
  );
}
