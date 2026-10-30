"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The admin editor, homepage, places map and photo pages provide their own controls.
// Those pages are matched by their markup rather than the path: subdomains
// rewrite "/" (maps.bneo.xyz → /map), so the server sees /map while the
// browser sees /, and branching on the path breaks hydration. Photos and the
// map are hidden in globals.css.
export function FloatingControls({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <div className="floating-controls fixed top-4 right-4 z-50 flex items-center gap-3 [body:has(.home-header)_&]:hidden">
      {children}
    </div>
  );
}
