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

type TimelineItem = {
  description: string;
  imageLinks?: ImageLink[];
};

type TimelineEvent = {
  period: string;
  month?: string;
  day?: string;
  items: TimelineItem[];
};

type TimelineProps = {
  events: TimelineEvent[];
};

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  // Helper component for image link with Floating UI positioning
  const ImageLinkComponent: React.FC<{ link: ImageLink }> = ({ link }) => {
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
  const renderDescription = (item: TimelineItem, itemIndex: number) => {
    if (!item.imageLinks || item.imageLinks.length === 0) {
      return item.description;
    }

    let remainingText = item.description;
    const parts: React.ReactNode[] = [];

    item.imageLinks.forEach((link, idx) => {
      const index = remainingText.indexOf(link.text);
      if (index !== -1) {
        // Add text before the link
        if (index > 0) {
          parts.push(
            <span key={`text-before-${itemIndex}-${idx}`}>
              {remainingText.substring(0, index)}
            </span>
          );
        }
        // Add the image link
        parts.push(
          <ImageLinkComponent key={`link-${itemIndex}-${idx}`} link={link} />
        );
        remainingText = remainingText.substring(index + link.text.length);
      }
    });

    // Add any remaining text
    if (remainingText.length > 0) {
      parts.push(<span key={`text-after-${itemIndex}`}>{remainingText}</span>);
    }

    return <>{parts}</>;
  };

  return (
    <div className="space-y-6 sm:space-y-10 font-serif">
      {events.map((event, eventIndex) => {
        const dateDetail =
          event.day && event.month
            ? `${event.month} ${event.day}`
            : event.month
              ? event.month
              : null;

        return (
          <div key={`${event.period}-${eventIndex}`} className="group/year">
            <div className="flex gap-2 sm:gap-4 text-[#595857] dark:text-[#F3F3F3]">
              <div className="min-w-[80px] sm:min-w-[100px] pt-0.5">
                <span className="text-sm opacity-50 tracking-wide transition-opacity group-hover/year:opacity-70">
                  {event.period}
                </span>
              </div>
              <div className="flex-1 space-y-2 -mt-0.5">
                {dateDetail && (
                  <div className="min-w-[70px] sm:min-w-[90px] pt-0.5">
                    <span className="text-sm opacity-30 transition-opacity group-hover/year:opacity-50">
                      {dateDetail}
                    </span>
                  </div>
                )}
                <ul className="space-y-2 list-none">
                  {event.items.map((item, itemIndex) => (
                    <li
                      key={`${event.period}-item-${itemIndex}`}
                      className="flex gap-2 leading-relaxed group/item"
                    >
                      <span className="opacity-30 transition-opacity group-hover/item:opacity-50">
                        -
                      </span>
                      <span className="flex-1">
                        {renderDescription(item, itemIndex)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
