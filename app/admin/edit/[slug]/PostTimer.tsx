"use client";

import { useEffect, useState } from "react";
import { createPostTimer } from "@/utils/postTimer";

export function PostTimer({ post }: { post: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const storage = {
      getItem: (key: string) => sessionStorage.getItem(key),
      setItem: (key: string, value: string) =>
        sessionStorage.setItem(key, value),
    };
    const timer = createPostTimer(post, storage);
    const tick = () => {
      setSeconds(Math.floor(timer.elapsed() / 1000));
      timer.checkpoint();
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    window.addEventListener("pagehide", timer.checkpoint);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", timer.checkpoint);
      timer.checkpoint();
    };
  }, [post]);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const time = `${hours ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <span
      className="tabular-nums"
      title="Time spent on this post; pauses when you leave this editor"
    >
      this post {time}
    </span>
  );
}
