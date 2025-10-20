"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";
const links = [
  { path: "/thoughts", text: "💭" },
  { path: "/hn", text: "📰" },
  { path: "/now", text: "now" },
  { path: "/curius", text: "curius" },
  { path: "/projects", text: "projects" },
  { path: "/library", text: "library" },
  { path: "/contact", text: "findme" },
  { path: "/posts", text: "archive" },
  { path: "/random", text: "🎲" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="md:sticky md:top-10 flex flex-col items-center mb-10 relative z-10">
      <div>
        <div className="font-bold text-center md:text-left mt-4 md:mt-0">
          <Link href="/">
            <h2>BENEDICT NEO 梁耀恩</h2>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center md:flex-col md:mt-10 space-x-2 md:space-x-0 md:justify-start">
          {links.map(({ path, text }) => (
            <Link
              key={path}
              href={path}
              className={`block ${
                pathname === path ? "text-gray-500" : "hover:underline"
              }`}
            >
              {text}
            </Link>
          ))}
          <ThemeSwitch />
        </div>
      </div>
    </div>
  );
}
