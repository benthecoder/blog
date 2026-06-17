"use client";

import { useState, useCallback, useEffect } from "react";
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

const StartPage = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * INTERESTS.length));
  }, []);

  const cycle = useCallback(() => {
    setIndex((prev) => {
      if (INTERESTS.length <= 1) return prev;
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * INTERESTS.length);
      }
      return next;
    });
  }, []);

  const current = INTERESTS[index];

  return (
    <div>
      <article className="prose">
        <p>welcome to my corner on the internet</p>

        <p>
          a little <Link href="/about">about me</Link>, i was born in{" "}
          <a
            href="https://en.wikipedia.org/wiki/Kuala_Lumpur"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kuala Lumpur, Malaysia
          </a>
          .
        </p>

        <p>
          i like{" "}
          <button type="button" onClick={cycle} className="start-interest">
            {current.text}
          </button>
          {current.href &&
            (current.external ? (
              <a
                href={current.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`open ${current.text}`}
                className="inline-flex items-center ml-1 opacity-40 hover:opacity-80 transition-opacity ![background-image:none]"
              >
                <ExternalLinkIcon />
              </a>
            ) : (
              <Link
                href={current.href}
                aria-label={`open ${current.text}`}
                className="inline-flex items-center ml-1 opacity-40 hover:opacity-80 transition-opacity ![background-image:none]"
              >
                <ExternalLinkIcon />
              </Link>
            ))}
        </p>

        <p>
          see what i&apos;m up to <Link href="/now">now</Link>, what i&apos;m{" "}
          <Link href="/library">reading</Link>, or what i{" "}
          <Link href="/uses">use</Link>.
        </p>

        <p>
          browse the <Link href="/posts">archives</Link>.{" "}
          <span className="text-xs opacity-40">
            (hint: press <code>r</code> if you&apos;re feeling lucky)
          </span>
        </p>
      </article>

      <div className="h-[60vh] mt-8 overflow-hidden border border-japanese-shiraumenezu dark:border-white/[0.08]">
        <KnowledgeMap className="w-full h-full" />
      </div>
    </div>
  );
};

export default StartPage;
