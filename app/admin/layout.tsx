"use client";

import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-auto bg-paper dark:bg-night admin-scrollbar">
      {children}
    </div>
  );
}
