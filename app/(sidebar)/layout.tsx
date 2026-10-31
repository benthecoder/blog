import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/SideBar";

export default function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col mx-2 lg:mx-10 lg:flex-row lg:items-start lg:mt-10">
      {/* Keyboard users would otherwise tab through every nav icon first. */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-2 focus:text-sm focus:bg-paper focus:text-ink focus:border focus:border-rule dark:focus:bg-night dark:focus:text-chalk-strong dark:focus:border-night-rule"
      >
        skip to content
      </a>
      <Sidebar />
      <main
        id="content"
        tabIndex={-1}
        className="focus:outline-none flex-auto text-base lg:mt-0 px-2 lg:px-10 max-w-xl xl:max-w-3xl has-[[data-search-page]]:max-w-6xl lg:has-[[data-search-page]]:ml-36 mx-auto w-full selection:bg-chalk-soft/20 dark:selection:bg-chalk-strong/20 mb-40"
      >
        {children}
      </main>
    </div>
  );
}
