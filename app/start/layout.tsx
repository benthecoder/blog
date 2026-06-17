import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "start here",
  description: "who is benedict neo",
};

export default function StartLayout({ children }: { children: ReactNode }) {
  return children;
}
