"use client";

import { useState } from "react";
import type { FC, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useClick,
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
  month?: string;
  day?: string;
  description: string;
  postSlug?: string;
  imageLinks?: ImageLink[];
};

type TimelineEvent = {
  period: string;
  items: TimelineItem[];
};

type TimelineProps = {
  events: TimelineEvent[];
};

// Defined at module scope so React never sees a new component type per render.
const ImageLinkComponent: FC<{ link: ImageLink }> = ({ link }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const click = useClick(context, { ignoreMouse: true });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline text-left underline decoration-solid decoration-1 cursor-pointer decoration-ink-soft/40 dark:decoration-chalk-soft/40 underline-offset-2 transition-[text-decoration-color] duration-150 hover:decoration-ink-soft dark:hover:decoration-chalk-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
      >
        {link.text}
      </button>
      {isOpen && (
        <FloatingPortal>
          <div
            // floating-ui's refs object exposes callback refs by design
            // eslint-disable-next-line react-hooks/refs
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
              loading="eager"
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

function renderDescription(item: TimelineItem, itemIndex: number): ReactNode {
  if (!item.imageLinks || item.imageLinks.length === 0) {
    return item.description;
  }

  let remainingText = item.description;
  const parts: ReactNode[] = [];

  item.imageLinks.forEach((link, idx) => {
    const index = remainingText.indexOf(link.text);
    if (index !== -1) {
      if (index > 0) {
        parts.push(
          <span key={`text-before-${itemIndex}-${idx}`}>
            {remainingText.substring(0, index)}
          </span>
        );
      }
      parts.push(
        <ImageLinkComponent key={`link-${itemIndex}-${idx}`} link={link} />
      );
      remainingText = remainingText.substring(index + link.text.length);
    }
  });

  if (remainingText.length > 0) {
    parts.push(<span key={`text-after-${itemIndex}`}>{remainingText}</span>);
  }

  return <>{parts}</>;
}

const Timeline: FC<TimelineProps> = ({ events }) => (
  <div className="space-y-6 font-serif">
    {events.map((event) => (
      <div key={event.period} className="group/year">
        <div className="flex gap-2 sm:gap-4 text-ink dark:text-chalk-strong">
          <div className="min-w-[60px] sm:min-w-[70px] pt-0.5">
            <span className="text-sm opacity-50 transition-opacity group-hover/year:opacity-70">
              {event.period}
            </span>
          </div>
          <div className="flex-1 space-y-2">
            {event.items.map((item, itemIndex) => {
              const dateDetail =
                item.day && item.month
                  ? `${item.month} ${item.day}`
                  : (item.month ?? null);

              return (
                <div
                  key={`${event.period}-item-${itemIndex}`}
                  className="group/item flex gap-2 sm:gap-4"
                >
                  <div className="min-w-[80px] sm:min-w-[90px]">
                    {dateDetail &&
                      (item.postSlug ? (
                        <Link
                          href={`/posts/${encodeURIComponent(item.postSlug)}`}
                          prefetch={false}
                          aria-label={`Read journal entry: ${item.description}`}
                          className="text-sm text-ink-soft dark:text-chalk-muted underline decoration-dotted underline-offset-4 hover:text-ink dark:hover:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          {dateDetail}
                        </Link>
                      ) : (
                        <span className="text-sm opacity-30 transition-opacity group-hover/item:opacity-50">
                          {dateDetail}
                        </span>
                      ))}
                  </div>
                  <span className="flex-1">
                    {renderDescription(item, itemIndex)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default Timeline;
