"use client";

import { useEffect, useState } from "react";

type PostViewTrackerProps = {
  slug: string;
};

const shouldSkipCount = () => {
  if (typeof window === "undefined") return true;
  const params = new URLSearchParams(window.location.search);
  return params.get("nocount") === "1";
};

const PostViewTracker = ({ slug }: PostViewTrackerProps) => {
  const [views, setViews] = useState<{
    slug: string;
    count: number | null;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    const track = async () => {
      try {
        if (shouldSkipCount()) {
          const res = await fetch(
            `/api/views?slug=${encodeURIComponent(slug)}`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (!controller.signal.aborted)
            setViews({ slug, count: data.count ?? null });
        } else {
          const res = await fetch("/api/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
            signal: controller.signal,
          });
          const data = await res.json();
          if (!controller.signal.aborted)
            setViews({ slug, count: data.count ?? null });
        }
      } catch {
        // Ignore failures; don't block page render.
      }
    };

    track();
    return () => controller.abort();
  }, [slug]);

  if (views?.slug !== slug || views.count === null) return null;

  // Colour and size come from the metadata row so the whole line stays uniform.
  return (
    <span className="tabular-nums">{views.count.toLocaleString()} views</span>
  );
};

export default PostViewTracker;
