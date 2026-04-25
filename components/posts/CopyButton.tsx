"use client";

import { useState } from "react";

export default function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      className="absolute top-2 right-2 p-1.5 rounded text-japanese-ginnezu hover:text-japanese-sumiiro dark:text-gray-500 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150"
    >
      {/* Copy icon */}
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
        style={{
          position: "absolute",
          opacity: copied ? 0 : 1,
          transform: copied ? "scale(0.8)" : "scale(1)",
          filter: copied ? "blur(4px)" : "blur(0)",
          transition: "opacity 150ms, transform 150ms, filter 150ms",
        }}
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>

      {/* Check icon */}
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
        style={{
          position: "absolute",
          opacity: copied ? 1 : 0,
          transform: copied ? "scale(1)" : "scale(0.8)",
          filter: copied ? "blur(0)" : "blur(4px)",
          transition: "opacity 150ms, transform 150ms, filter 150ms",
        }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>

      {/* Spacer — sizes the button, both icons are absolute */}
      <svg width="14" height="14" aria-hidden="true" />
    </button>
  );
}
