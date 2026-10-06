import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "colophon",
  description: "Colophon for bneo.xyz.",
};

export default function ColophonPage() {
  return (
    <article className="prose max-w-none">
      <h1>colophon</h1>
      <ul>
        <li>
          Fonts:{" "}
          <a href="https://fonts.google.com/specimen/Averia+Serif+Libre">
            Averia Serif Libre
          </a>
        </li>
        <li>Colors: indigo, olive, gold, steel, vermillion, rose</li>
        <li>Icons: my drawings</li>
        <li>
          Sounds: <a href="https://github.com/Danilaa1/cuelume">Cuelume</a>
        </li>
        <li>
          Tech: <a href="https://nextjs.org/">Next.js</a>,{" "}
          <a href="https://tailwindcss.com/">Tailwind CSS</a>
        </li>
        <li>
          Host: <a href="https://vercel.com/">Vercel</a>
        </li>
        <li>
          Github:{" "}
          <a href="https://github.com/benthecoder/blog">benthecoder/blog</a>
        </li>
      </ul>
    </article>
  );
}
