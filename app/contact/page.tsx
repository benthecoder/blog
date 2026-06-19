import type { ComponentType } from "react";
import Image from "next/image";
import { Scroll, Camera, Pencil, Box, Play, Code2 } from "lucide-react";

type LinkItemProps = {
  href: string;
  children: string;
};

const LinkItem = ({ href, children }: LinkItemProps) => (
  <a
    href={href}
    className="opacity-75 hover:opacity-100 transition-opacity duration-150"
  >
    {children}
  </a>
);

type LinkSectionProps = {
  icon: ComponentType<{ className?: string }>;
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

const SECTIONS: LinkSectionProps[] = [
  {
    icon: Scroll,
    links: [
      { href: "https://twitter.com/benxneo", text: "twitter" },
      { href: "https://www.linkedin.com/in/benedictneo/", text: "linkedin" },
    ],
  },
  {
    icon: Camera,
    links: [
      { href: "https://vsco.co/benxneo/gallery", text: "vsco" },
      { href: "https://www.instagram.com/benthesaint/", text: "instagram" },
      { href: "https://www.corner.inc/benedict", text: "corner" },
    ],
  },
  {
    icon: Pencil,
    links: [
      { href: "https://substack.com/@bneo", text: "substack" },
      { href: "https://benedictxneo.medium.com/", text: "medium" },
      { href: "https://goodreads.com/bneo", text: "goodreads" },
    ],
  },
  {
    icon: Box,
    links: [
      { href: "https://www.are.na/benedict-neo", text: "are.na" },
      { href: "https://curius.app/benedict-neo", text: "curius" },
      { href: "https://www.cosmos.so/benedictneo", text: "cosmos" },
    ],
  },
  {
    icon: Play,
    links: [
      {
        href: "https://open.spotify.com/user/31w6rspp4fe5ihwoimt4of5tcwiu",
        text: "spotify",
      },
      { href: "https://www.youtube.com/@benxneo", text: "youtube" },
      { href: "https://letterboxd.com/benneo/", text: "letterboxd" },
    ],
  },
  {
    icon: Code2,
    links: [
      { href: "https://github.com/benthecoder", text: "github" },
      {
        href: "https://www.kaggle.com/benthecoder/competitions",
        text: "kaggle",
      },
    ],
  },
];

const ContactPage = () => (
  <div>
    <article className="prose">
      <Image
        src="/images/havetea.jpeg"
        alt="have tea"
        width={800}
        height={600}
        className="mb-4 w-full h-auto"
        priority
      />

      <p>lover of tea and good conversations</p>

      <p>email: thisis[firstname][lastname][at]gmail[dot]com</p>

      <div className="space-y-0 leading-relaxed">
        {SECTIONS.map((section) => (
          <LinkSection
            key={section.links[0].href}
            icon={section.icon}
            links={section.links}
          />
        ))}
      </div>
    </article>
  </div>
);

export default ContactPage;
