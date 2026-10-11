"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The admin editor and places map provide their own controls.
export function FloatingControls({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname === "/map") return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {children}
    </div>
  );
}
