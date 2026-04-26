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
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;

    const track = async () => {
      try {
        if (shouldSkipCount()) {
          const res = await fetch(
            `/api/views?slug=${encodeURIComponent(slug)}`
          );
          const data = await res.json();
          setCount(data.count ?? null);
        } else {
          const res = await fetch("/api/views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          const data = await res.json();
          setCount(data.count ?? null);
        }
      } catch {
        // Ignore failures; don't block page render.
      }
    };

    track();
  }, [slug]);

  if (count === null) return null;

  return (
    <span className="text-japanese-ginnezu dark:text-japanese-ginnezu text-xs tabular-nums">
      {count.toLocaleString()} views
    </span>
  );
};

export default PostViewTracker;
