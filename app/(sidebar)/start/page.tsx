"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DRAWINGS_URL } from "@/config/constants";

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

// Everything on the site, as a plain list of names — the doodle nav in
// the rail is decoration; this is the version you can actually read.
const INDEX: { text: string; href: string; external?: boolean }[] = [
  { text: "about", href: "/about" },
  { text: "posts", href: "/posts" },
  { text: "essays", href: "/essays" },
  { text: "wiki", href: "/wiki" },
  { text: "thoughts", href: "/thoughts" },
  { text: "projects", href: "/projects" },
  { text: "map", href: "/map" },
  { text: "photos", href: "/photos" },
  { text: "sketchbook", href: "/sketch" },
  { text: "papers", href: "/papers" },
  { text: "recipes", href: "/recipes" },
  { text: "now", href: "/now" },
  { text: "reading", href: "/library" },
  { text: "uses", href: "/uses" },
  { text: "findme", href: "/contact" },
  { text: "curius", href: "https://curius.app/benedict-neo", external: true },
  { text: "til", href: "https://github.com/benthecoder/til", external: true },
  { text: "rss", href: "/api/rss" },
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

  // Randomize only after hydration; random in render/initializer would
  // mismatch the server HTML.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(Math.floor(Math.random() * INTERESTS.length));
  }, []);

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

  return (
    <div>
      {/* One picture, then words — the sketch is a scan on white paper, so
          it blends onto the page the same way the home artwork does. */}
      <div className="relative w-full max-w-sm aspect-square mb-8">
        <Image
          src={`${DRAWINGS_URL}/christ.png`}
          alt="nativity sketch"
          fill
          priority
          sizes="(max-width: 640px) 85vw, 384px"
          className="object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
        />
      </div>

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
                className="inline-flex items-center ml-1 opacity-40 hover:opacity-80 transition-opacity bg-none!"
              >
                <ExternalLinkIcon />
              </a>
            ) : (
              <Link
                href={current.href}
                aria-label={`open ${current.text}`}
                className="inline-flex items-center ml-1 opacity-40 hover:opacity-80 transition-opacity bg-none!"
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
          browse the <Link href="/posts">archives</Link> or wonder through the{" "}
          <Link href="/photos">frames</Link> or wherever.{" "}
          <span className="text-xs opacity-40">
            {/* explicit string: turbopack's server/client compiles disagree
                about the space between </code> and the entity-bearing text */}
            (hint: press <code>r</code>
            {" if you're feeling lucky)"}
          </span>
        </p>
      </article>

      <nav aria-label="site index" className="mt-10 font-serif">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2.5">
          {INDEX.map((item) => (
            <li key={item.text}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  {item.text}
                  <ExternalLinkIcon />
                </a>
              ) : (
                <Link href={item.href}>{item.text}</Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="h-[50vh] mt-12 overflow-hidden border border-rule dark:border-white/8">
        <KnowledgeMap className="w-full h-full" />
      </div>
    </div>
  );
};

export default StartPage;
