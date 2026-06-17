"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./SideBar";
import ThemeSwitch from "@/components/ui/ThemeSwitch";
import SearchModal from "@/components/ui/SearchModal";
import { useRandomPost } from "./useRandomPost";

export function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useRandomPost();
  const isHome = pathname === "/";
  const isGallery = pathname === "/gallery";
  const isAdmin = pathname?.startsWith("/admin");

  if (isHome || isGallery || isAdmin) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeSwitch />
        </div>
        <SearchModal />
        {children}
      </>
    );
  }

  return (
    <div className="flex flex-col mx-2 lg:mx-10 lg:flex-row lg:items-start lg:mt-10">
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch />
      </div>
      <SearchModal />
      <Sidebar />
      <main className="flex-auto text-base lg:mt-0 px-2 lg:px-10 max-w-xl xl:max-w-3xl mx-auto w-full selection:bg-japanese-murasakisuishiyou/20 dark:selection:bg-japanese-nyuhakushoku/20 mb-40">
        {children}
      </main>
    </div>
  );
}
