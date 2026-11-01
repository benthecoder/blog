"use client";

import { useState } from "react";
import { play } from "cuelume";

export default function CopyButton({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const copied = status === "copied";
  const label =
    status === "error"
      ? "Copy failed. Try again."
      : copied
        ? "Copied"
        : "Copy code";

  const copy = async () => {
    setStatus("idle");
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      setStatus("error");
      return;
    }
    setStatus("copied");
    play("success");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <button
      onClick={copy}
      aria-label={label}
      title={label}
      className="absolute top-2 right-2 p-1.5 rounded-sm text-ink-soft hover:text-accent dark:text-chalk-muted hover:bg-primary/10 transition-colors duration-150"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute transition-[opacity,transform,filter] duration-150 ${
          copied
            ? "opacity-0 scale-[0.8] blur-xs"
            : "opacity-100 scale-100 blur-none"
        }`}
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute transition-[opacity,transform,filter] duration-150 ${
          copied
            ? "opacity-100 scale-100 blur-none"
            : "opacity-0 scale-[0.8] blur-xs"
        }`}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>

      {/* Spacer — sizes the button, both icons are absolute */}
      <svg width="14" height="14" aria-hidden="true" />
    </button>
  );
}
