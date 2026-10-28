import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "start here",
  description: "who is benedict neo",
  path: "/start",
});

export default function StartLayout({ children }: { children: ReactNode }) {
  return children;
}
