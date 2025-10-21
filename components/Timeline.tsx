"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

type ImageLink = {
  text: string;
  imagePath: string;
  altText?: string;
};

type TimelineEvent = {
  year: string;
  month?: string;
  day?: string;
  description: string;
  imageLinks?: ImageLink[];
};

type TimelineProps = {
  events: TimelineEvent[];
};

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  // Group events by year
  const groupedEvents = events.reduce(
    (acc, event) => {
      if (!acc[event.year]) {
        acc[event.year] = [];
      }
      acc[event.year].push(event);
      return acc;
    },
    {} as Record<string, TimelineEvent[]>
  );

  // Helper component for image link with smart positioning
  const ImageLinkComponent: React.FC<{ link: ImageLink; idx: number }> = ({
    link,
    idx,
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>({
      top: 0,
      left: 0,
    });
    const spanRef = useRef<HTMLSpanElement>(null);

    const calculatePosition = () => {
      if (spanRef.current) {
        const rect = spanRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Image dimensions (max)
        const imageMaxWidth = Math.min(1200, viewportWidth * 0.9);
        const imageMaxHeight = Math.min(800, viewportHeight * 0.8);

        // Calculate center position
        const centerX = rect.left + rect.width / 2;

        // Calculate left position (centered on word, but constrained to viewport)
        let left = centerX - imageMaxWidth / 2;
        const rightEdge = left + imageMaxWidth;

        // Adjust if going off screen
        if (left < 10) {
          left = 10; // 10px padding from left edge
        } else if (rightEdge > viewportWidth - 10) {
          left = viewportWidth - imageMaxWidth - 10; // 10px padding from right edge
        }

        // Calculate vertical position
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - rect.bottom;

        let top;
        if (spaceAbove > imageMaxHeight + 20 || spaceAbove > spaceBelow) {
          // Show above
          top = rect.top - imageMaxHeight - 8;
        } else {
          // Show below
          top = rect.bottom + 8;
        }

        // Ensure image doesn't go off top or bottom
        if (top < 10) {
          top = 10;
        } else if (top + imageMaxHeight > viewportHeight - 10) {
          top = viewportHeight - imageMaxHeight - 10;
        }

        setPosition({ top, left });
        setIsVisible(true);
      }
    };

    const handleMouseEnter = () => {
      calculatePosition();
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (isVisible) {
        setIsVisible(false);
      } else {
        calculatePosition();
      }
    };

    return (
      <>
        <span
          className="underline decoration-solid decoration-1 cursor-pointer decoration-[#91989C]/40 dark:decoration-[#91989C]/40 underline-offset-2 transition-all hover:decoration-[#91989C] hover:dark:decoration-[#91989C]"
          ref={spanRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {link.text}
        </span>
        {isVisible && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <Image
              src={link.imagePath}
              alt={link.altText || link.text}
              className="image-hover"
              width={800}
              height={600}
            />
          </div>
        )}
      </>
    );
  };

  // Helper to render description with image links
  const renderDescription = (event: TimelineEvent) => {
    if (!event.imageLinks || event.imageLinks.length === 0) {
      return event.description;
    }

    let remainingText = event.description;
    const parts: React.ReactNode[] = [];

    event.imageLinks.forEach((link, idx) => {
      const index = remainingText.indexOf(link.text);
      if (index !== -1) {
        // Add text before the link
        if (index > 0) {
          parts.push(remainingText.substring(0, index));
        }
        // Add the image link
        parts.push(<ImageLinkComponent key={idx} link={link} idx={idx} />);
        remainingText = remainingText.substring(index + link.text.length);
      }
    });

    // Add any remaining text
    if (remainingText.length > 0) {
      parts.push(remainingText);
    }

    return <>{parts}</>;
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      {Object.entries(groupedEvents).map(([year, yearEvents]) => (
        <div key={year} className="group/year">
          <div className="flex gap-2 sm:gap-4 text-[#595857] dark:text-[#F3F3F3]">
            <div className="min-w-[50px] sm:min-w-[70px] pt-0.5">
              <span className="text-sm opacity-50 tracking-wide transition-opacity group-hover/year:opacity-70">
                {year}
              </span>
            </div>
            <div className="flex-1 space-y-2 sm:space-y-4 -mt-0.5">
              {yearEvents.map((event, index) => {
                const dateDetail =
                  event.day && event.month
                    ? `${event.month} ${event.day}`
                    : event.month
                      ? event.month
                      : null;

                return (
                  <div
                    key={index}
                    className="flex gap-1.5 sm:gap-3 group/event"
                  >
                    {dateDetail ? (
                      <>
                        <div className="min-w-[70px] sm:min-w-[90px] pt-0.5">
                          <span className="text-sm opacity-30 transition-opacity group-hover/event:opacity-50">
                            {dateDetail}
                          </span>
                        </div>
                        <div className="flex-1 leading-relaxed">
                          {renderDescription(event)}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 leading-relaxed">
                        {renderDescription(event)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
