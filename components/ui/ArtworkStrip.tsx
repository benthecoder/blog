"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DRAWINGS_URL } from "@/config/constants";
import styles from "./ArtworkStrip.module.css";

const SKETCHES = [
  ["sunflowersketch.png", 1404, 1872],
  ["handrose.png", 1096, 1519],
  ["peony.png", 1404, 1872],
  ["hummingbird.png", 1404, 1872],
  ["howl.png", 1389, 1850],
  ["hokusai.png", 1404, 1872],
  ["christ.png", 1404, 1872],
  ["metro.png", 1872, 1404],
  ["wave.png", 1282, 1518],
  ["room.png", 1872, 1404],
  ["angel.png", 951, 1827],
  ["icons.jpg", 1854, 2475],
  ["psalms.png", 1404, 1872],
] as const;

export default function ArtworkStrip() {
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: true });

  useEffect(() => {
    const element = strip.current;
    if (!element) return;
    const update = () => {
      const end = element.scrollWidth - element.clientWidth;
      setEdges({
        start: element.scrollLeft > 1,
        end: element.scrollLeft < end - 1,
      });
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const element = strip.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        event.shiftKey ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      )
        return;
      const distance =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? element.clientWidth
            : 1);
      const end = element.scrollWidth - element.clientWidth;
      if (
        (distance < 0 && element.scrollLeft <= 0) ||
        (distance > 0 && element.scrollLeft >= end - 1)
      )
        return;
      event.preventDefault();
      element.scrollLeft += distance;
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <section aria-label="Drawings" className="relative mt-8 mb-8">
      <div
        ref={strip}
        role="region"
        aria-label="Sketchbook"
        className={`${styles.strip} -mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 py-1`}
      >
        {SKETCHES.map(([file, width, height], index) => (
          <Link
            key={file}
            href="/sketch"
            style={{ width: (176 * width) / height }}
            className="relative block h-44 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Image
              src={`${DRAWINGS_URL}/${file}`}
              alt={`${file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")} sketch`}
              fill
              sizes={`${Math.ceil((176 * width) / height)}px`}
              className="artwork-layer object-contain select-none"
              data-shown="true"
              priority={index === 0}
              draggable={false}
            />
          </Link>
        ))}
      </div>
      {(["start", "end"] as const).map((side) => (
        <div
          key={side}
          aria-hidden="true"
          data-hidden={!edges[side]}
          className={`${styles.edge} ${styles[side]}`}
        >
          <span />
          <span />
          <span />
        </div>
      ))}
    </section>
  );
}
