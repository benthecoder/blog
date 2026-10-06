import type { Metadata } from "next";
import Link from "next/link";
import SoundSwitch from "@/components/ui/SoundSwitch";

export const metadata: Metadata = {
  title: "colophon",
  description: "How this little corner of the internet is made.",
};

export default function ColophonPage() {
  return (
    <article className="prose max-w-none">
      <h1>colophon</h1>
      <p className="text-ink-soft dark:text-chalk-muted">
        a notebook with room to experiment
      </p>
      <p>
        This site is a place to create more than I consume: daily observations,
        photographs, things worth remembering, and small experiments that make
        the internet feel a little more personal.
      </p>

      <h2>the materials</h2>
      <p>
        The typeface is{" "}
        <a href="https://fonts.google.com/specimen/Averia+Serif+Libre">
          Averia Serif Libre
        </a>
        . Sketches and drawings sit alongside six ink palettes: indigo, olive,
        gold, steel, vermillion, and rose. The palette and light/dark controls
        let you choose your own reading light.
      </p>
      <p>
        Little interface sounds come from{" "}
        <a href="https://github.com/Danilaa1/cuelume">Cuelume</a>. You can
        switch them off below; the choice stays on this device. The archive has
        a random door: press <kbd>r</kbd> when you are not typing to wander into
        an older post.
      </p>

      <SoundSwitch />

      <h2>under the paper</h2>
      <p>
        Built with <a href="https://nextjs.org/">Next.js</a>, React, TypeScript,
        and <a href="https://tailwindcss.com/">Tailwind CSS</a>. Posts and{" "}
        <Link href="/wiki">wiki pages</Link> are Markdown files in Git.
        Connected notes use <code>[[wiki links]]</code>; the graph makes those
        connections visible.
      </p>
      <p>
        The local writing desk uses CodeMirror, with Markdown preview and a
        photo picker. The site runs on Vercel, photographs live in Cloudflare
        R2, and short <Link href="/thoughts">thoughts</Link> live in Neon
        Postgres. ESLint, oxlint, Prettier, Vitest, and CodeQL help keep the
        moving pieces in order.
      </p>

      <h2>follow a thread</h2>
      <p>
        Read the <Link href="/posts">journal</Link>, wander through the{" "}
        <Link href="/wiki">wiki</Link>, browse the{" "}
        <Link href="/gallery">photographs</Link>, or see what I am{" "}
        <Link href="/library">reading</Link>. The source is on{" "}
        <a href="https://github.com/benthecoder/blog">GitHub</a>, including the
        bits still being figured out.
      </p>
      <p>Made to be revisited, revised, and played with.</p>
    </article>
  );
}
