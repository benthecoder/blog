"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { hoverTick } from "@/utils/hoverTick";
import { SketchIcon } from "../ui/SketchIcon";

const links = [
  { path: "/posts", text: "archive", icon: "archive.svg" },
  { path: "/random", text: "random", icon: "random.svg" },
  { path: "/contact", text: "findme", icon: "contact.svg" },
  { path: "/now", text: "now", icon: "now.svg" },
  { path: "/curius", text: "curius", icon: "bookmark.svg" },
  { path: "/syllabus", text: "syllabus", icon: "code.svg" },
  { path: "/library", text: "library", icon: "library.svg" },
  { path: "/thoughts", text: "thoughts", icon: "thoughts.svg" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [spinning, setSpinning] = useState(false);
  const [prefetchPath, setPrefetchPath] = useState<string | null>(null);
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

  const showTooltip = (
    el: HTMLAnchorElement,
    text: string,
    playSound: boolean
  ) => {
    const rect = el.getBoundingClientRect();
    const isMobile = window.innerWidth < 1024;

    if (playSound) hoverTick();

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
      {/* One row at every width below lg. flex-wrap plus the 44px
          coarse-pointer minimum is what left "thoughts" alone on a
          second line on a phone. Gap shrinks only when eight 2rem
          icons would otherwise overflow. */}
      <nav
        aria-label="Site navigation"
        className="flex w-full flex-row flex-nowrap justify-center gap-[clamp(0.25rem,calc((100%-16rem)/7),1.25rem)] sm:gap-2 lg:w-auto lg:flex-col lg:flex-nowrap lg:gap-2 lg:fixed lg:top-[max(50%,24.5rem)] lg:-translate-y-1/2 lg:left-10 mb-12 lg:mb-0"
      >
        {links.map(({ path, text, icon }) => (
          <Link
            key={path}
            href={path}
            aria-current={pathname === path ? "page" : undefined}
            prefetch={
              path !== "/random" && prefetchPath === path ? null : false
            }
            className={`inline-flex items-center justify-center w-8 h-8 shrink-0 sm:pointer-coarse:min-h-11 sm:pointer-coarse:min-w-11 lg:w-9 lg:h-9 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              pathname === path ? "opacity-50" : "hover:opacity-70"
            }`}
            onMouseEnter={(e) => {
              setPrefetchPath(path);
              showTooltip(e.currentTarget, text, true);
            }}
            onFocus={(e) => {
              setPrefetchPath(path);
              showTooltip(e.currentTarget, text, false);
            }}
            onMouseLeave={() => setHoveredLink(null)}
            onBlur={() => setHoveredLink(null)}
            onClick={
              path === "/random"
                ? (e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("random-dice-click"));
                  }
                : undefined
            }
          >
            <SketchIcon
              src={`/icons/${icon}`}
              label={text}
              className={`w-8 h-8 lg:w-9 lg:h-9${path === "/random" && spinning ? " dice-spin" : ""}`}
            />
          </Link>
        ))}
      </nav>

      {hoveredLink && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 bg-accent/90 text-surface backdrop-blur-xs rounded-sm text-xs font-medium whitespace-nowrap"
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
