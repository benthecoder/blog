"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";

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

// Month name to number mapping for sorting
const monthToNumber: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  // Group events by year and sort chronologically within each year
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

  // Sort events within each year
  Object.keys(groupedEvents).forEach((year) => {
    groupedEvents[year].sort((a, b) => {
      const monthA = a.month ? monthToNumber[a.month.toLowerCase()] || 0 : 0;
      const monthB = b.month ? monthToNumber[b.month.toLowerCase()] || 0 : 0;

      if (monthA !== monthB) {
        return monthA - monthB;
      }

      const dayA = a.day ? parseInt(a.day, 10) : 0;
      const dayB = b.day ? parseInt(b.day, 10) : 0;

      return dayA - dayB;
    });
  });

  // Helper component for image link with Floating UI positioning
  const ImageLinkComponent: React.FC<{ link: ImageLink; eventId: string }> = ({
    link,
    eventId,
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: "top",
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(8),
        flip({
          fallbackAxisSideDirection: "start",
        }),
        shift({
          padding: 8,
        }),
      ],
    });

    const hover = useHover(context, { move: false });
    const focus = useFocus(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: "tooltip" });

    const { getReferenceProps, getFloatingProps } = useInteractions([
      hover,
      focus,
      dismiss,
      role,
    ]);

    return (
      <>
        <span
          ref={refs.setReference}
          {...getReferenceProps()}
          className="underline decoration-solid decoration-1 cursor-pointer decoration-[#91989C]/40 dark:decoration-[#91989C]/40 underline-offset-2 transition-all hover:decoration-[#91989C] hover:dark:decoration-[#91989C]"
        >
          {link.text}
        </span>
        {isOpen && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 pointer-events-none"
            >
              <Image
                src={link.imagePath}
                alt={link.altText || link.text}
                className="image-hover"
                width={400}
                height={600}
                style={{ maxWidth: "90vw", height: "auto" }}
              />
            </div>
          </FloatingPortal>
        )}
      </>
    );
  };

  // Helper to render description with image links
  const renderDescription = (event: TimelineEvent, eventIndex: number) => {
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
          parts.push(
            <span key={`text-before-${eventIndex}-${idx}`}>
              {remainingText.substring(0, index)}
            </span>
          );
        }
        // Add the image link
        parts.push(
          <ImageLinkComponent
            key={`link-${eventIndex}-${idx}`}
            link={link}
            eventId={`${eventIndex}-${idx}`}
          />
        );
        remainingText = remainingText.substring(index + link.text.length);
      }
    });

    // Add any remaining text
    if (remainingText.length > 0) {
      parts.push(<span key={`text-after-${eventIndex}`}>{remainingText}</span>);
    }

    return <>{parts}</>;
  };

  return (
    <div className="space-y-6 sm:space-y-10 font-serif">
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

                const eventKey = `${year}-${event.month || "no-month"}-${event.day || "no-day"}-${index}`;

                return (
                  <div
                    key={eventKey}
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
                          {renderDescription(event, index)}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 leading-relaxed">
                        {renderDescription(event, index)}
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
