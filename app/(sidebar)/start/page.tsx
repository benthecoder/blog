"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const KnowledgeMap = dynamic(
  () => import("@/components/visualizations/KnowledgeMap"),
  { ssr: false }
);

interface Interest {
  text: string;
  href?: string;
  external?: boolean;
}

const INTERESTS: Interest[] = [
  { text: "miso" },
  { text: "making fun websites", href: "/projects" },
  { text: "lifting heavy things" },
  { text: "ping pong" },
  { text: "deep conversations" },
  {
    text: "rabbitholing on curius",
    href: "https://curius.app/benedict-neo",
    external: true,
  },
];

const ExternalLinkIcon = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3 h-3 relative -top-px"
  >
    <path d="M6 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8" />
    <path d="M9 1h4v4" />
    <line x1="13" y1="1" x2="7" y2="7" />
  </svg>
);

/**
 * The story unfolds in three beats: "corner" opens it, "about me" completes
 * it, and the rest of the page arrives together. Only the first two words
 * advance anything — the interest below just cycles.
 */
const LAST_STEP = 2;
/** Reveal the rest on its own if nobody has poked it in this long. */
const IDLE_REVEAL_MS = 6000;

/**
 * One beat. The 0fr -> 1fr row animates height so lines grow into place
 * instead of the page jumping, and the content stays in the DOM throughout,
 * so the reveal is presentation rather than a gate on the navigation.
 */
const Beat = ({
  shown,
  delay = 0,
  children,
}: {
  shown: boolean;
  delay?: number;
  children: ReactNode;
}) => (
  <div
    className="reveal"
    data-shown={shown}
    aria-hidden={!shown}
    style={delay ? { transitionDelay: `${delay}ms` } : undefined}
  >
    <div>{children}</div>
  </div>
);

/** A word you can poke: carries the wash, and reads as a button. */
const Poke = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) => (
  <button type="button" onClick={onClick} className="wash">
    {children}
  </button>
);

const StartPage = () => {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = () => setStep((s) => Math.min(s + 1, LAST_STEP));

  // Randomize only after hydration; random in render/initializer would
  // mismatch the server HTML.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(Math.floor(Math.random() * INTERESTS.length));
  }, []);

  // Any advance restarts the idle clock, so someone working through the story
  // at their own pace never gets fast-forwarded past it.
  useEffect(() => {
    if (step >= LAST_STEP) return;
    idle.current = setTimeout(() => setStep(LAST_STEP), IDLE_REVEAL_MS);
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, [step]);

  /** Only swaps the interest — the story has already finished by here. */
  const cycle = () => {
    setIndex((prev) => {
      if (INTERESTS.length <= 1) return prev;
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * INTERESTS.length);
      }
      return next;
    });
  };

  const current = INTERESTS[index];
  const told = step >= LAST_STEP;

  return (
    <div>
      <article className="prose">
        <p>
          welcome to my{" "}
          {step >= 1 ? "corner" : <Poke onClick={advance}>corner</Poke>} on the
          internet
        </p>

        <Beat shown={step >= 1}>
          <p>
            a little{" "}
            {step >= 2 ? "about me" : <Poke onClick={advance}>about me</Poke>}
          </p>
        </Beat>

        {/* The link lives on "born", so the word you poked to get here isn't
            also the word that navigates away. */}
        <Beat shown={told}>
          <p>
            i was <Link href="/about">born</Link> in KL, Malaysia.
          </p>
        </Beat>

        <Beat shown={told} delay={120}>
          <p>
            i like{" "}
            <button type="button" onClick={cycle} className="wash">
              {current.text}
            </button>
            {current.href &&
              (current.external ? (
                <a
                  href={current.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`open ${current.text}`}
                  className="inline-flex items-center ml-1 opacity-40 hover:opacity-80 transition-opacity"
                >
                  <ExternalLinkIcon />
                </a>
              ) : (
                <Link
                  href={current.href}
                  aria-label={`open ${current.text}`}
                  className="inline-flex items-center ml-1 opacity-40 hover:opacity-80 transition-opacity"
                >
                  <ExternalLinkIcon />
                </Link>
              ))}
          </p>
        </Beat>

        <Beat shown={told} delay={240}>
          <p>
            see what i&apos;m up to <Link href="/now">now</Link>, what i&apos;m{" "}
            <Link href="/library">reading</Link>, or what i{" "}
            <Link href="/uses">use</Link>.
          </p>
        </Beat>

        <Beat shown={told} delay={360}>
          <p>
            browse the <Link href="/posts">archives</Link>.{" "}
            <span className="text-xs opacity-40">
              (hint: press <code>r</code>)
            </span>
          </p>
        </Beat>
      </article>

      {/* Mounted only once the story lands. It is a dynamic import drawing a
          thousand-odd points, so keeping it out of the first paint is a real
          saving, not just staging. */}
      {told && (
        <div className="map-in h-[60vh] mt-8 overflow-hidden border border-rule dark:border-white/8">
          <KnowledgeMap className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default StartPage;
