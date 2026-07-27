"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/utils/content/toc";

// Desktop-only rail rendered to the right of the post column. Scrollspy is
// scroll-position based (topmost heading above the reading line) rather than
// IntersectionObserver, so exactly one entry is active at all times.
const TableOfContents = ({ items }: { items: TocEntry[] }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      let current: string | null = null;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          current = item.id;
        }
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop: rail in the whitespace right of the post column. */}
      <nav
        aria-label="Table of contents"
        className="hidden xl:block absolute left-full top-0 bottom-0 ml-12 w-52"
      >
        <ul className="sticky top-24 max-h-[75vh] overflow-y-auto space-y-1.5 text-xs border-l border-rule dark:border-night-rule pl-4">
          {items.map((item) => (
            <li key={item.id} className={item.depth === 3 ? "pl-3" : ""}>
              <a
                href={`#${item.id}`}
                // Active has to differ from idle by more than hue: `ink` and
                // `ink-soft` are the same value in some palettes, so light
                // mode leaned on a distinction that wasn't there. Weight plus
                // a muted→strong jump reads in both modes.
                className={`block transition-colors duration-150 ${
                  activeId === item.id
                    ? "font-medium text-ink-strong dark:text-chalk-strong"
                    : "text-ink-muted dark:text-chalk-muted hover:text-ink-strong dark:hover:text-chalk"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile/tablet: collapsed block between title and body. */}
      <details className="xl:hidden mb-8 text-sm text-ink-soft dark:text-chalk-muted">
        <summary className="cursor-pointer select-none w-fit hover:text-ink dark:hover:text-chalk transition-colors duration-150">
          Contents
        </summary>
        <ul className="mt-2 space-y-1.5 border-l border-rule dark:border-night-rule pl-4">
          {items.map((item) => (
            <li key={item.id} className={item.depth === 3 ? "pl-3" : ""}>
              <a
                href={`#${item.id}`}
                className="block hover:text-ink dark:hover:text-chalk transition-colors duration-150"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
};

export default TableOfContents;
