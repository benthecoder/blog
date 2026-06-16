"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
  };

  return (
    <div className="fixed inset-0 overflow-auto bg-white dark:bg-gray-900">
      {!isLoginPage && (
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 text-xs text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
        >
          Log out
        </button>
      )}
      {children}
    </div>
  );
}
