import type { ReactNode } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { NavLink } from "@/components/photos/NavLink";
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
          Photos <span>/ ben neo</span>
        </Link>
        <nav aria-label="Photos">
          <NavLink href="/photos" exact>
            All
          </NavLink>
          <NavLink href="/photos/places">Places</NavLink>
          <NavLink href="/photos/trips" also="/photos/sets">
            Trips
          </NavLink>
          <a href="https://bneo.xyz">Blog ↗</a>
        </nav>
      </header>
      {children}
      <footer className="photo-footer">
        <span>ben neo — shot on whatever was in my pocket</span>
        <a href="https://bneo.xyz">bneo.xyz ↗</a>
      </footer>
    </div>
  );
}
