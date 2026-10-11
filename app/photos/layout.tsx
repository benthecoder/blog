import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Camera, House, Images } from "lucide-react";
import ThemeSwitch from "@/components/ui/ThemeSwitch";
import "./photos.css";

export default function PhotosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="photo-site">
      <nav className="photo-nav" aria-label="Photography navigation">
        <Link
          href="https://bneo.xyz"
          aria-label="Back to the blog"
          title="Blog"
        >
          <House size={19} strokeWidth={1.5} />
        </Link>
        <Link href="/photos" aria-label="Photo collections" title="Collections">
          <Images size={19} strokeWidth={1.5} />
        </Link>
        <Link
          href="/photos/stream"
          aria-label="Photostream"
          title="Photostream"
        >
          <Camera size={19} strokeWidth={1.5} />
        </Link>
        <span className="photo-nav-theme">
          <ThemeSwitch />
        </span>
      </nav>
      {children}
      <footer className="photo-footer">
        <Link href="https://bneo.xyz">
          Benedict Neo <ArrowUpRight size={13} />
        </Link>
        <span>Photos & little moments.</span>
      </footer>
    </div>
  );
}
