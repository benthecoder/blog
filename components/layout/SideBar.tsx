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
  } | null>(null);

  return (
    <div className="md:sticky md:top-10 flex flex-col items-center mb-10 relative z-10">
      <div>
        <div className="font-bold text-center md:text-left mt-4 md:mt-0 mb-8">
          <Link
            href="/"
            className="flex flex-row items-center justify-center md:justify-start gap-2"
          >
            <Image
              src="/icons/ename.svg"
              alt="BENEDICT NEO"
              width={10}
              height={10}
              className="w-24 h-auto dark:invert"
              priority
            />
            <Image
              src="/icons/cname.svg"
              alt="梁耀恩"
              width={10}
              height={10}
              className="w-28 h-auto dark:invert"
              priority
            />
          </Link>
        </div>

        <div className="flex flex-row gap-2 justify-center md:flex md:flex-col mt-2 md:mt-10 md:gap-0 md:justify-start">
          {links.map(({ path, text, icon }) => (
            <Link
              key={path}
              href={path}
              className={`block ${
                pathname === path ? "text-gray-500" : "hover:underline"
              }`}
              onMouseMove={(e) => {
                setHoveredLink({
                  text,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {icon ? (
                <Image
                  src={`/icons/${icon}`}
                  alt={text}
                  width={10}
                  height={10}
                  className="inline-block w-8 h-8 md:w-12 md:h-12 dark:invert"
                />
              ) : (
                text
              )}
            </Link>
          ))}
        </div>
      </div>

      {hoveredLink && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 bg-japanese-sumiiro/90 dark:bg-japanese-shironezu/90 text-japanese-kinairo dark:text-japanese-sumiiro backdrop-blur-sm rounded text-xs font-medium"
          style={{ left: hoveredLink.x + 12, top: hoveredLink.y + 12 }}
        >
          {hoveredLink.text}
        </div>
      )}
    </div>
  );
}
