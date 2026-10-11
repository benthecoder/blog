"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Palette/theme switches float over every page; the admin editor has its own
// top-right controls. Photography pages also provide their own navigation.
export function FloatingControls({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/photos"))
    return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {children}
    </div>
  );
}
