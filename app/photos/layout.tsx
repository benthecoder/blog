import type { ReactNode } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { PhotoNav } from "@/components/photos/PhotoNav";
import { PhotoUpdates } from "@/components/photos/PhotoUpdates";
import "./photos.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-photo-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-photo-mono" });

export default function PhotosLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`photo-site ${sans.variable} ${mono.variable}`}>
      <PhotoUpdates />
      <header className="photo-bar">
        <Link href="/photos" className="photo-brand">
          Benedict Neo
        </Link>
        <PhotoNav />
      </header>
      {children}
    </div>
  );
}
