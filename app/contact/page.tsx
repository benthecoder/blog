"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LuScroll,
  LuCamera,
  LuPencil,
  LuBox,
  LuPlay,
  LuCode2,
} from "react-icons/lu";

type LinkItemProps = {
  href: string;
  children: string;
};

const LinkItem = ({ href, children }: LinkItemProps) => (
  <a
    href={href}
    className="opacity-75 hover:opacity-100 transition-opacity duration-200 no-underline bg-none"
    style={{ background: "none", textDecoration: "none" }}
  >
    {children}
  </a>
);

type LinkSectionProps = {
  icon: React.ComponentType<{ className?: string }>;
  links: { href: string; text: string }[];
};

const LinkSection = ({ icon: Icon, links }: LinkSectionProps) => (
  <div className="flex items-center gap-2">
    <Icon className="opacity-40 text-sm flex-shrink-0" />
    <div>
      {links.map((link, idx) => (
        <span key={link.href}>
          {idx > 0 && ", "}
          <LinkItem href={link.href}>{link.text}</LinkItem>
        </span>
      ))}
    </div>
  </div>
);

const ContactPage = () => {
  const sections = [
    {
      icon: LuScroll,
      links: [
        { href: "https://twitter.com/benxneo", text: "twitter" },
        { href: "https://www.linkedin.com/in/benedictneo/", text: "linkedin" },
      ],
    },
    {
      icon: LuCamera,
      links: [
        { href: "https://vsco.co/benxneo/gallery", text: "vsco" },
        { href: "https://www.instagram.com/benthesaint/", text: "instagram" },
        { href: "https://www.corner.inc/benedict", text: "corner" },
      ],
    },
    {
      icon: LuPencil,
      links: [
        { href: "https://substack.com/@bneo", text: "substack" },
        { href: "https://benedictxneo.medium.com/", text: "medium" },
        { href: "https://goodreads.com/bneo", text: "goodreads" },
      ],
    },
    {
      icon: LuBox,
      links: [
        { href: "https://www.are.na/benedict-neo", text: "are.na" },
        { href: "https://curius.app/benedict-neo", text: "curius" },
        { href: "https://www.cosmos.so/benedictneo", text: "cosmos" },
      ],
    },
    {
      icon: LuPlay,
      links: [
        {
          href: "https://open.spotify.com/user/31w6rspp4fe5ihwoimt4of5tcwiu",
          text: "spotify",
        },
        { href: "http://www.youtube.com/@benxneo", text: "youtube" },
        { href: "https://letterboxd.com/benneo/", text: "letterboxd" },
      ],
    },
    {
      icon: LuCode2,
      links: [
        { href: "https://github.com/benthecoder", text: "github" },
        {
          href: "https://www.kaggle.com/benthecoder/competitions",
          text: "kaggle",
        },
      ],
    },
  ];

  return (
    <div>
      <article className="prose">
        <Image
          src="/images/havetea.jpeg"
          alt="have tea"
          width={800}
          height={600}
          className="w-full mb-4"
        />

        <p>
          i love meeting and having interesting conversations with new people!
        </p>

        <p>
          i also like learning about <Link href="/tags/art">art</Link> and
          reading{" "}
          <a href="https://www.goodreads.com/review/list/103179068-benedict-neo?shelf=to-read">
            good books
          </a>
          .
        </p>

        <p>email: thisis[firstname][lastname][at]gmail[dot]com</p>

        <div className="space-y-0 leading-relaxed">
          {sections.map((section, idx) => (
            <LinkSection key={idx} icon={section.icon} links={section.links} />
          ))}
        </div>
      </article>
    </div>
  );
};

export default ContactPage;
