"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const links = [
  { path: "/thoughts", text: "thoughts", icon: "thoughts.svg" },
  { path: "/hn", text: "hn", icon: "news.svg" },
  { path: "/now", text: "now", icon: "now.svg" },
  { path: "/curius", text: "curius", icon: "bookmark.svg" },
  { path: "/projects", text: "projects", icon: "code.svg" },
  { path: "/library", text: "library", icon: "library.svg" },
  { path: "/contact", text: "findme", icon: "contact.svg" },
  { path: "/posts", text: "archive", icon: "archive.svg" },
  { path: "/gallery", text: "gallery", icon: "gallery.svg" },
  { path: "/random", text: "random", icon: "random.svg" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredLink, setHoveredLink] = useState<{
    text: string;
    x: number;
    y: number;
    isMobile: boolean;
  } | null>(null);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLAnchorElement>,
    text: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isMobile = window.innerWidth < 768; // md breakpoint

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
      {/* Name section */}
      <div className="flex flex-col items-center mb-2 md:fixed md:top-10 md:left-10 md:mb-2">
        <div className="font-bold text-center md:text-left mt-4 mb-2 md:mt-0">
          <Link
            href="/"
            className="flex flex-row md:flex-col items-center justify-center md:justify-start gap-2"
          >
            <Image
              src="/icons/ename.svg"
              alt="BENEDICT NEO"
              width={10}
              height={10}
              className="w-24 md:w-32 h-auto dark:invert"
              priority
            />
            <Image
              src="/icons/cname.svg"
              alt="梁耀恩"
              width={10}
              height={10}
              className="w-24 md:w-32 h-auto dark:invert"
              priority
            />
          </Link>
        </div>
      </div>

      {/* Navigation icons */}
      <nav className="flex flex-row gap-2 justify-center md:flex-col md:fixed md:top-1/2 md:-translate-y-1/2 md:left-10 mb-6 md:mb-0">
        {links.map(({ path, text, icon }) => (
          <Link
            key={path}
            href={path}
            className={`inline-flex w-8 h-8 md:w-11 md:h-11 ${
              pathname === path ? "text-gray-500" : "hover:underline"
            }`}
            onMouseEnter={(e) => handleMouseEnter(e, text)}
            onMouseLeave={() => setHoveredLink(null)}
          >
            {icon ? (
              <Image
                src={`/icons/${icon}`}
                alt={text}
                width={10}
                height={10}
                className="w-full h-full dark:invert"
              />
            ) : (
              text
            )}
          </Link>
        ))}
      </nav>

      {hoveredLink && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 bg-japanese-sumiiro/90 dark:bg-japanese-shironezu/90 text-japanese-kinairo dark:text-japanese-sumiiro backdrop-blur-sm rounded text-xs font-medium whitespace-nowrap"
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
