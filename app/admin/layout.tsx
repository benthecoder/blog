import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-auto bg-white dark:bg-gray-900">
      {children}
    </div>
  );
}
