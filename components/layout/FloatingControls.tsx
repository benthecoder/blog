"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The admin editor, places map and photo pages provide their own controls.
// Subdomains rewrite "/" (photos.bneo.xyz → /photos), so the path alone can't
// tell; globals.css also hides these whenever a photos page is on screen.
export function FloatingControls({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/photos") ||
    pathname === "/map"
  )
    return null;
  return (
    <div className="floating-controls fixed top-4 right-4 z-50 flex items-center gap-3">
      {children}
    </div>
  );
}
