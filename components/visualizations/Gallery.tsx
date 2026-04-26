"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { GalleryImage } from "@/utils/getGalleryImages";

interface GalleryProps {
  images: GalleryImage[];
}

interface ImagePosition {
  image: GalleryImage;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Each tile lazily loads via IntersectionObserver.
// Only images visible in the viewport (+ 400px buffer) are fetched.
function GalleryTile({
  pos,
  onHover,
  onLeave,
}: {
  pos: ImagePosition;
  onHover: (image: GalleryImage, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // loaded once, never unload
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-hidden"
      style={{ width: pos.width, height: pos.height }}
      onMouseMove={(e) => onHover(pos.image, e.clientX, e.clientY)}
      onMouseLeave={onLeave}
    >
      {inView ? (
        <Image
          src={pos.image.path}
          alt={pos.image.filename}
          fill
          sizes="150px"
          style={{ objectFit: "contain" }}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-white/5" />
      )}
    </div>
  );
}

export default function Gallery({ images }: GalleryProps) {
  const [hoveredImage, setHoveredImage] = useState<{
    image: GalleryImage;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const BASE_SIZE = 150;
  const GAP = 10;
  const COLS = 12;

  const imagePositions = useRef(
    (() => {
      const columnHeights = new Array(COLS).fill(0);
      const columnX = Array.from(
        { length: COLS },
        (_, i) => i * (BASE_SIZE + GAP)
      );

      return images.map((img, i) => {
        let seed = 12345 + i;
        const random = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };
        void random(); // consume seed

        const width = BASE_SIZE;
        const height = width / img.aspectRatio;

        const shortestColIndex = columnHeights.indexOf(
          Math.min(...columnHeights)
        );
        const x = columnX[shortestColIndex];
        const y = columnHeights[shortestColIndex];
        columnHeights[shortestColIndex] += height + GAP;

        return { image: img, x, y, width, height };
      });
    })()
  ).current;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let currentX = 0;
    let currentY = 0;
    let currentZoom = 1.5;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const gridWidth = COLS * (BASE_SIZE + GAP);
    const gridHeight = Math.max(
      ...imagePositions.map((pos) => pos.y + pos.height)
    );

    currentX = window.innerWidth / 2 - (gridWidth / 2) * currentZoom;
    currentY = window.innerHeight / 2 - (gridHeight / 2) * currentZoom;
    canvas.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentZoom})`;

    const clampPosition = (x: number, y: number, zoom: number) => {
      const scaledWidth = gridWidth * zoom;
      const scaledHeight = gridHeight * zoom;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return {
        x: Math.max(vw - scaledWidth - vw * 0.01, Math.min(vw * 0.01, x)),
        y: Math.max(vh - scaledHeight - vh * 0.01, Math.min(vh * 0.01, y)),
      };
    };

    const applyTransform = (x: number, y: number, zoom: number) => {
      canvas.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
      container.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;
      const c = clampPosition(currentX, currentY, currentZoom);
      currentX = c.x;
      currentY = c.y;
      applyTransform(currentX, currentY, currentZoom);
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = "grab";
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.005;
        const oldZoom = currentZoom;
        currentZoom = Math.max(1.0, Math.min(2.5, currentZoom + delta));
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const scale = currentZoom / oldZoom;
        currentX = mx - (mx - currentX) * scale;
        currentY = my - (my - currentY) * scale;
      } else {
        currentX -= e.deltaX;
        currentY -= e.deltaY;
      }
      const c = clampPosition(currentX, currentY, currentZoom);
      currentX = c.x;
      currentY = c.y;
      applyTransform(currentX, currentY, currentZoom);
    };

    // Touch
    let initialDistance = 0;
    let initialZoom = 1.5;
    let touchStartX = 0;
    let touchStartY = 0;

    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const center = (t: TouchList) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        touchStartX = e.touches[0].clientX - currentX;
        touchStartY = e.touches[0].clientY - currentY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        initialDistance = dist(e.touches);
        initialZoom = currentZoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        currentX = e.touches[0].clientX - touchStartX;
        currentY = e.touches[0].clientY - touchStartY;
        const c = clampPosition(currentX, currentY, currentZoom);
        currentX = c.x;
        currentY = c.y;
        applyTransform(currentX, currentY, currentZoom);
      } else if (e.touches.length === 2) {
        const currentDistance = dist(e.touches);
        const oldZoom = currentZoom;
        currentZoom = Math.max(
          1.0,
          Math.min(2.5, initialZoom * (currentDistance / initialDistance))
        );
        const c2 = center(e.touches);
        const rect = container.getBoundingClientRect();
        const tx = c2.x - rect.left;
        const ty = c2.y - rect.top;
        const scale = currentZoom / oldZoom;
        currentX = tx - (tx - currentX) * scale;
        currentY = ty - (ty - currentY) * scale;
        const c = clampPosition(currentX, currentY, currentZoom);
        currentX = c.x;
        currentY = c.y;
        applyTransform(currentX, currentY, currentZoom);
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    document.body.style.overscrollBehavior = "none";

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      document.body.style.overscrollBehavior = "";
    };
  }, [imagePositions]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-black cursor-grab"
      style={{ touchAction: "none", overscrollBehavior: "none" }}
    >
      <Link
        href="/"
        className="absolute bottom-4 left-4 z-20 w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors duration-150"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </Link>

      <div
        ref={canvasRef}
        style={{
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {imagePositions.map((pos) =>
          pos.image.usedInPosts.length > 0 ? (
            <Link
              key={pos.image.path}
              href={`/posts/${pos.image.usedInPosts[0].slug}`}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                width: pos.width,
                height: pos.height,
              }}
            >
              <GalleryTile
                pos={pos}
                onHover={(img, x, y) => setHoveredImage({ image: img, x, y })}
                onLeave={() => setHoveredImage(null)}
              />
            </Link>
          ) : (
            <div
              key={pos.image.path}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                width: pos.width,
                height: pos.height,
              }}
            >
              <GalleryTile
                pos={pos}
                onHover={(img, x, y) => setHoveredImage({ image: img, x, y })}
                onLeave={() => setHoveredImage(null)}
              />
            </div>
          )
        )}
      </div>

      {hoveredImage && (
        <div
          className={`fixed z-50 pointer-events-none px-2 py-1 backdrop-blur-sm rounded text-[11px] ${
            hoveredImage.image.usedInPosts.length > 0
              ? "bg-white/90 text-black font-medium"
              : "bg-black/80 text-white"
          }`}
          style={{ left: hoveredImage.x + 15, top: hoveredImage.y + 15 }}
        >
          {hoveredImage.image.usedInPosts.length > 0 && "→ "}
          {hoveredImage.image.filename.replace(
            /\.(jpg|jpeg|png|gif|webp|svg)$/i,
            ""
          )}
        </div>
      )}
    </div>
  );
}
