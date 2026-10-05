"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Palette/theme switches float over every page; the admin editor has its own
// top-right controls, so they're hidden there.
export function FloatingControls({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {children}
    </div>
  );
}
