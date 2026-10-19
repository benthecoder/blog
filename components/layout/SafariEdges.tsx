"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

/**
 * Keeps mobile Safari's chrome (status bar area + bottom toolbar area)
 * painted with the same colors as the visible top and bottom edges of
 * the page.
 *
 * One palette calculation feeds everything: the two fixed edge strips
 * (.edge-top / .edge-bottom, portaled to <body> so they never sit inside
 * a transformed ancestor), the html/body backgrounds, and the
 * theme-color meta. The edge colors are sampled from whatever is
 * actually painted at the viewport's top and bottom edges, so pages
 * whose background changes as you scroll stay matched.
 */
export default function SafariEdges() {
  const [mounted, setMounted] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    const body = document.body;

    // Save shared document state so leaving restores it exactly.
    const prevHtmlBg = html.style.backgroundColor;
    const prevHtmlBgImage = html.style.backgroundImage;
    const prevHtmlBgAttachment = html.style.backgroundAttachment;
    const prevBodyBg = body.style.backgroundColor;
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    const createdMeta = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const prevMetaContent = meta.getAttribute("content");

    let raf = 0;

    const token = (name: string) =>
      getComputedStyle(html).getPropertyValue(name).trim();

    // The page background is a token gradient (globals.css `body`):
    // paper-sunken at the top running to paper-raised at the bottom in
    // light mode, flat night in dark. Palettes only move the ink tier,
    // so the edge colors come straight from the surface tokens.
    const paletteEdge = (edge: "top" | "bottom"): string =>
      html.classList.contains("dark")
        ? token("--color-night")
        : token(
            edge === "top" ? "--color-paper-sunken" : "--color-paper-raised"
          );

    // If a page paints its own solid background at an edge (the map,
    // the photo viewer), match that instead of the body gradient.
    const visibleBackgroundAt = (y: number, edge: "top" | "bottom"): string => {
      const x = Math.floor(window.innerWidth / 2);
      let el: Element | null = document.elementFromPoint(x, y);
      while (el && el !== html && el !== body) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") return bg;
        el = el.parentElement;
      }
      return paletteEdge(edge);
    };

    const apply = () => {
      raf = 0;
      // One calculation, applied to every surface the spec names.
      const top = visibleBackgroundAt(2, "top");
      const bottom = visibleBackgroundAt(window.innerHeight - 2, "bottom");
      topRef.current?.style.setProperty("--edge-top-background", top);
      bottomRef.current?.style.setProperty("--edge-bottom-background", bottom);
      html.style.backgroundColor = top;
      // The sidebar layout's top margin collapses to the viewport top,
      // where only the html background paints — a flat color there reads
      // as a hard band against the body's gradient. Clone the gradient
      // (fixed, like body's) so the strip continues it instead.
      html.style.backgroundImage = getComputedStyle(body).backgroundImage;
      html.style.backgroundAttachment = "fixed";
      body.style.backgroundColor = bottom;
      meta.setAttribute("content", top);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    // Restored scroll positions and late layout (fonts, images) settle
    // after first paint; re-sample once things are quiet.
    const settle = window.setTimeout(schedule, 300);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    // Theme / palette switches land as attribute changes on <html>/<body>.
    const observer = new MutationObserver(schedule);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-palette"],
    });
    observer.observe(body, {
      attributes: true,
      childList: true,
      subtree: false,
    });

    return () => {
      window.clearTimeout(settle);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      observer.disconnect();
      html.style.backgroundColor = prevHtmlBg;
      html.style.backgroundImage = prevHtmlBgImage;
      html.style.backgroundAttachment = prevHtmlBgAttachment;
      body.style.backgroundColor = prevBodyBg;
      if (createdMeta) meta.remove();
      else if (prevMetaContent === null) meta.removeAttribute("content");
      else meta.setAttribute("content", prevMetaContent);
    };
  }, [mounted, pathname]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div ref={topRef} aria-hidden className="edge-top" />
      <div ref={bottomRef} aria-hidden className="edge-bottom" />
    </>,
    document.body
  );
}
