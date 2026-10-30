import type { Metadata } from "next";
import Image from "next/image";
import { pageMetadata } from "@/utils/pageMetadata";
import LastPlayed from "./LastPlayed";

export const metadata: Metadata = pageMetadata({
  title: "findme",
  path: "/contact",
});

const PROFILES = [
  { site: "x", user: "benedictneo", href: "https://x.com/benedictneo" },
  {
    site: "linkedin",
    user: "benedictneo",
    href: "https://www.linkedin.com/in/benedictneo/",
  },
  {
    site: "instagram",
    user: "benthesaint",
    href: "https://www.instagram.com/benthesaint/",
  },
  {
    site: "github",
    user: "benthecoder",
    href: "https://github.com/benthecoder",
  },
];

const SPOTIFY_PROFILE =
  "https://open.spotify.com/user/31w6rspp4fe5ihwoimt4of5tcwiu";

const row = "contents";
const label = "text-muted";

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

      <div className="grid grid-cols-[6rem_1fr] gap-y-2">
        <div className={row}>
          <span className={label}>email</span>
          <span>thisis[firstname][lastname][at]gmail[dot]com</span>
        </div>
        {PROFILES.map(({ site, user, href }) => (
          <div key={site} className={row}>
            <span className={label}>{site}</span>
            <span>
              <a href={href}>{user}</a>
            </span>
          </div>
        ))}
        <div className={row}>
          <span className={label}>spotify</span>
          <LastPlayed profileUrl={SPOTIFY_PROFILE} />
        </div>
      </div>
    </article>
  </div>
);

export default ContactPage;
