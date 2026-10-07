import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "colophon",
  description: "Colophon for bneo.xyz.",
};

const inks = [
  ["indigo", "#4d5f9e"],
  ["olive", "#47502f"],
  ["gold", "#896818"],
  ["steel", "#3f6d99"],
  ["vermillion", "#ab4322"],
  ["rose", "#93495c"],
] as const;

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
        <li>
          Colors:{" "}
          <span className="inline-flex flex-wrap gap-x-3 gap-y-1 align-middle">
            {inks.map(([name, hex]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5"
                title={name}
              >
                <span
                  data-palette={name}
                  className="colophon-swatch inline-block size-2.5 rounded-full bg-ink"
                  aria-hidden="true"
                />
                <span className="font-mono text-xs">{hex}</span>
              </span>
            ))}
          </span>
        </li>
        <li>Icons: homemade</li>
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
