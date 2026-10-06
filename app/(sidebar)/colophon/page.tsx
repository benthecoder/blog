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
          type:{" "}
          <a href="https://fonts.google.com/specimen/Averia+Serif+Libre">
            Averia Serif Libre
          </a>
        </li>
        <li>hand-drawn navigation</li>
        <li>
          sounds: <a href="https://github.com/Danilaa1/cuelume">Cuelume</a>
        </li>
        <li>
          <a href="https://nextjs.org/">Next.js</a> +{" "}
          <a href="https://tailwindcss.com/">Tailwind CSS</a>
        </li>
        <li>Markdown + Git</li>
        <li>hosted on Vercel</li>
        <li>
          <a href="https://github.com/benthecoder/blog">source</a>
        </li>
      </ul>
    </article>
  );
}
