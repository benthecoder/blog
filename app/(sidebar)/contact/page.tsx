import type { Metadata } from "next";
import Image from "next/image";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "findme",
  path: "/contact",
});

const LINKS = [
  { href: "https://x.com/benedictneo", text: "twitter" },
  { href: "https://www.linkedin.com/in/benedictneo/", text: "linkedin" },
  { href: "https://www.instagram.com/benthesaint/", text: "instagram" },
  { href: "https://github.com/benthecoder", text: "github" },
];

const ContactPage = () => (
  <div>
    <h1 className="sr-only">findme</h1>
    <article className="prose">
      {/* `not-prose` opts out of the 65vh cap that keeps inline post images
          from dominating a page — here the photo is the point, so it runs
          the full column width. */}
      <Image
        src="/images/havetea.jpeg"
        alt="have tea"
        width={800}
        height={600}
        className="not-prose mb-4 w-full h-auto rounded-sm shadow-xs"
        priority
      />

      <p>lover of tea and good conversations</p>

      <p>email: thisis[firstname][lastname][at]gmail[dot]com</p>

      <p>
        {LINKS.map((link, idx) => (
          <span key={link.href}>
            {idx > 0 && " · "}
            <a href={link.href}>{link.text}</a>
          </span>
        ))}
      </p>
    </article>
  </div>
);

export default ContactPage;
