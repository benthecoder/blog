"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./SideBar";
import ThemeSwitch from "@/components/ui/ThemeSwitch";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGallery = pathname === "/gallery";
  const isAdmin = pathname?.startsWith("/admin");

  if (isGallery || isAdmin) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeSwitch />
        </div>
        {children}
      </>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch />
      </div>
      <Sidebar />
      <main className="flex-auto text-md md:mt-0 px-2 md:px-10 max-w-xl lg:max-w-3xl mx-auto w-full selection:bg-japanese-murasakisuishiyou/20 dark:selection:bg-japanese-nyuhakushoku/20 mb-40">
        {children}
      </main>
    </>
  );
}
