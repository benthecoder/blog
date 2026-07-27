import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/SideBar";

export default function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col mx-2 lg:mx-10 lg:flex-row lg:items-start lg:mt-10">
      <Sidebar />
      <main className="flex-auto text-base lg:mt-0 px-2 lg:px-10 max-w-xl xl:max-w-3xl mx-auto w-full selection:bg-chalk-soft/20 dark:selection:bg-chalk-strong/20 mb-40">
        {children}
      </main>
    </div>
  );
}
