import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import "./photos.css";

export default function PhotosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="photo-site">
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
