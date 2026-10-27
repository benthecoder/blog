import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page is a client component, so its title lives here.
export const metadata: Metadata = { title: "hn" };

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
