"use client";

import { useEffect } from "react";

type PostViewTrackerProps = {
  slug: string;
};

const shouldSkipCount = () => {
  if (typeof window === "undefined") return true;
  const params = new URLSearchParams(window.location.search);
  return params.get("nocount") === "1";
};

const PostViewTracker = ({ slug }: PostViewTrackerProps) => {
  useEffect(() => {
    if (!slug || shouldSkipCount()) return;

    const increment = async () => {
      try {
        await fetch("/api/views", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug }),
        });
      } catch {
        // Ignore failures; don't block page render.
      }
    };

    increment();
  }, [slug]);

  return null;
};

export default PostViewTracker;
