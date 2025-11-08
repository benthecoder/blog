"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { GalleryImage } from "@/utils/getGalleryImages";

interface GalleryProps {
  images: GalleryImage[];
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

  // Masonry layout algorithm
  const imagePositions = useRef(
    (() => {
      const sizes = [1];

      // Track height of each column
      const columnHeights = new Array(COLS).fill(0);
      const columnX = Array.from(
        { length: COLS },
        (_, i) => i * (BASE_SIZE + GAP)
      );

      return images.map((img, i) => {
        // Seeded random for deterministic size variation
        let seed = 12345 + i;
        const random = () => {
          seed = (seed * 16807) % 2147483647;
          return (seed - 1) / 2147483646;
        };

        const sizeMult = sizes[Math.floor(random() * sizes.length)];

        // Use the actual aspect ratio of the image
        const width = BASE_SIZE * sizeMult;
        const height = width / img.aspectRatio;

        // Find shortest column (masonry algorithm)
        const shortestColIndex = columnHeights.indexOf(
          Math.min(...columnHeights)
        );

        const x = columnX[shortestColIndex];
        const y = columnHeights[shortestColIndex];

        // Update column height
        columnHeights[shortestColIndex] += height + GAP;

        return {
          image: img,
          x,
          y,
          width,
          height,
        };
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

    // Initialize centered
    currentX = window.innerWidth / 2 - (gridWidth / 2) * currentZoom;
    currentY = window.innerHeight / 2 - (gridHeight / 2) * currentZoom;
    canvas.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentZoom})`;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
      container.style.cursor = "grabbing";
    };

    const clampPosition = (x: number, y: number, zoom: number) => {
      const scaledWidth = gridWidth * zoom;
      const scaledHeight = gridHeight * zoom;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Allow 20% buffer outside viewport
      const maxX = viewportWidth * 0.01;
      const minX = viewportWidth - scaledWidth - viewportWidth * 0.01;
      const maxY = viewportHeight * 0.01;
      const minY = viewportHeight - scaledHeight - viewportHeight * 0.01;

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      currentX = e.clientX - startX;
      currentY = e.clientY - startY;

      const clamped = clampPosition(currentX, currentY, currentZoom);
      currentX = clamped.x;
      currentY = clamped.y;

      canvas.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentZoom})`;
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = "grab";
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom with better limits
        const delta = -e.deltaY * 0.005;
        const oldZoom = currentZoom;
        currentZoom = Math.max(1.0, Math.min(2.5, currentZoom + delta));

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scale = currentZoom / oldZoom;
        currentX = mouseX - (mouseX - currentX) * scale;
        currentY = mouseY - (mouseY - currentY) * scale;

        const clamped = clampPosition(currentX, currentY, currentZoom);
        currentX = clamped.x;
        currentY = clamped.y;

        canvas.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentZoom})`;
      } else {
        // Pan
        currentX -= e.deltaX;
        currentY -= e.deltaY;

        const clamped = clampPosition(currentX, currentY, currentZoom);
        currentX = clamped.x;
        currentY = clamped.y;

        canvas.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentZoom})`;
      }
    };

    // Touch event handlers for mobile
    let initialDistance = 0;
    let initialZoom = 1.5;
    let touchStartX = 0;
    let touchStartY = 0;

    const getTouchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList) => {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - pan
        isDragging = true;
        touchStartX = e.touches[0].clientX - currentX;
        touchStartY = e.touches[0].clientY - currentY;
      } else if (e.touches.length === 2) {
        // Two finger - zoom
        isDragging = false;
        initialDistance = getTouchDistance(e.touches);
        initialZoom = currentZoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDragging) {
        // Single touch pan
        currentX = e.touches[0].clientX - touchStartX;
        currentY = e.touches[0].clientY - touchStartY;

        const clamped = clampPosition(currentX, currentY, currentZoom);
        currentX = clamped.x;
        currentY = clamped.y;

        canvas.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentZoom})`;
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / initialDistance;
        const oldZoom = currentZoom;
        currentZoom = Math.max(1.0, Math.min(2.5, initialZoom * scale));

        const center = getTouchCenter(e.touches);
        const rect = container.getBoundingClientRect();
        const touchX = center.x - rect.left;
        const touchY = center.y - rect.top;

        const zoomScale = currentZoom / oldZoom;
        currentX = touchX - (touchX - currentX) * zoomScale;
        currentY = touchY - (touchY - currentY) * zoomScale;

        const clamped = clampPosition(currentX, currentY, currentZoom);
        currentX = clamped.x;
        currentY = clamped.y;

        canvas.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentZoom})`;
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
      style={{
        touchAction: "none",
        overscrollBehavior: "none",
      }}
    >
      <Link
        href="/"
        className="absolute bottom-4 left-4 z-20 w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors"
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
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      >
        {imagePositions.map((pos) => {
          const hasPost = pos.image.usedInPosts.length > 0;

          const imageEl = (
            <div
              className="relative overflow-hidden group"
              style={{
                width: pos.width,
                height: pos.height,
              }}
              onMouseMove={(e) => {
                setHoveredImage({
                  image: pos.image,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              onMouseLeave={() => setHoveredImage(null)}
            >
              <Image
                src={pos.image.path}
                alt={pos.image.filename}
                fill
                sizes="300px"
                style={{ objectFit: "contain" }}
                draggable={false}
              />
            </div>
          );

          if (hasPost) {
            return (
              <Link
                key={pos.image.path}
                href={`/posts/${pos.image.usedInPosts[0].slug}`}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                }}
              >
                {imageEl}
              </Link>
            );
          }

          return (
            <div
              key={pos.image.path}
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
              }}
            >
              {imageEl}
            </div>
          );
        })}
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
