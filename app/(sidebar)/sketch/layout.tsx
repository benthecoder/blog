import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/utils/pageMetadata";

// The page is a client component, so its title lives here.
export const metadata: Metadata = pageMetadata({
  title: "sketch",
  path: "/sketch",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
