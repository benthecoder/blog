"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PhotoUpdates() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      // Keep an open viewer's selected photo stable while new uploads arrive.
      if (
        document.visibilityState === "visible" &&
        !document.querySelector("dialog[open]")
      )
        router.refresh();
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);
  return null;
}
