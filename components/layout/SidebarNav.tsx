"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { play } from "cuelume";
import { SketchIcon } from "../ui/SketchIcon";

const links = [
  { path: "/posts", text: "archive", icon: "archive.svg" },
  { path: "/random", text: "random", icon: "random.svg" },
  { path: "/contact", text: "findme", icon: "contact.svg" },
  { path: "/hn", text: "hn", icon: "news.svg" },
  { path: "/now", text: "now", icon: "now.svg" },
  { path: "/curius", text: "curius", icon: "bookmark.svg" },
  { path: "/projects", text: "projects", icon: "code.svg" },
  { path: "/library", text: "library", icon: "library.svg" },
  { path: "/thoughts", text: "thoughts", icon: "thoughts.svg" },
  { path: "/gallery", text: "gallery", icon: "gallery.svg" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [spinning, setSpinning] = useState(false);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onSpin() {
      setSpinning(true);
      if (spinTimer.current) clearTimeout(spinTimer.current);
      spinTimer.current = setTimeout(() => setSpinning(false), 500);
    }
    window.addEventListener("random-spin", onSpin);
    return () => {
      window.removeEventListener("random-spin", onSpin);
      if (spinTimer.current) clearTimeout(spinTimer.current);
    };
  }, []);

  const [hoveredLink, setHoveredLink] = useState<{
    text: string;
    x: number;
    y: number;
    isMobile: boolean;
  } | null>(null);

  const handleMouseEnter = (e: MouseEvent<HTMLAnchorElement>, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isMobile = window.innerWidth < 1024;

    // Not data-cuelume-hover: its 150ms throttle is global, so fast sweeps
    // drop ticks. Pointer check skips touch, where taps emulate mouseenter.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      play("tick");
    }

    if (isMobile) {
      // Position below and centered on mobile
      setHoveredLink({
        text,
        x: rect.left + rect.width / 2,
        y: rect.bottom,
        isMobile: true,
      });
    } else {
      // Position to the right on desktop
      setHoveredLink({
        text,
        x: rect.right,
        y: rect.top,
        isMobile: false,
      });
    }
  };

  return (
    <>
      {/* Extra bottom gap on small screens: the nav used to sit against a
          white content card that separated it from the page title, and
          without that card the two run together. */}
      <nav className="flex flex-row gap-2 justify-center lg:flex-col lg:fixed lg:top-1/2 lg:-translate-y-1/2 lg:left-10 mb-12 lg:mb-0">
        {links.map(({ path, text, icon }) => (
          <Link
            key={path}
            href={path}
            className={`inline-flex w-8 h-8 lg:w-11 lg:h-11 transition-opacity ${
              pathname === path ? "opacity-50" : "hover:opacity-70"
            }`}
            onMouseEnter={(e) => handleMouseEnter(e, text)}
            onMouseLeave={() => setHoveredLink(null)}
            onClick={
              path === "/random"
                ? (e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("random-dice-click"));
                  }
                : undefined
            }
          >
            {icon ? (
              <SketchIcon
                src={`/icons/${icon}`}
                label={text}
                className={`w-full h-full${path === "/random" && spinning ? " dice-spin" : ""}`}
              />
            ) : (
              text
            )}
          </Link>
        ))}
      </nav>

      {hoveredLink && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 bg-ink/90 dark:bg-chalk/90 text-paper dark:text-night backdrop-blur-xs rounded-sm text-xs font-medium whitespace-nowrap"
          style={
            hoveredLink.isMobile
              ? {
                  left: hoveredLink.x,
                  top: hoveredLink.y + 8,
                  transform: "translateX(-50%)",
                }
              : {
                  left: hoveredLink.x + 8,
                  top: hoveredLink.y,
                }
          }
        >
          {hoveredLink.text}
        </div>
      )}
    </>
  );
}
