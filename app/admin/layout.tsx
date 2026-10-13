"use client";

import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-auto bg-surface admin-scrollbar">
      {children}
    </div>
  );
}
