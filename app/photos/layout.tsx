import type { ReactNode } from "react";
import Link from "next/link";
import { PhotoUpdates } from "@/components/photos/PhotoUpdates";
import "./photos.css";

export default function PhotosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="photo-site">
      <PhotoUpdates />
      {children}
      <footer className="photo-footer">
        <Link href="https://bneo.xyz">Blog</Link>
        <span>Photos & little moments.</span>
      </footer>
    </div>
  );
}
