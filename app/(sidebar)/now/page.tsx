import type { Metadata } from "next";
import SpotifyNowPlaying from "./SpotifyNowPlaying";
import Clock from "@/components/ui/Clock";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({ title: "now", path: "/now" });

export default function NowPage() {
  return (
    <div>
      <article className="prose">
        <p>
          this is a <a href="https://sive.rs/nowff">now</a> page
        </p>
        <p>
          Location: Miami, FL
          <br />
          Time: <Clock />
        </p>
        <ul className="list-disc">
          <li>
            building cool stuff for AI in healthcare @{" "}
            <a href="https://openevidence.com">OpenEvidence</a>
          </li>
          <li>finding balance in life and work and trying to sleep more</li>
          <li>
            experimenting with{" "}
            <a href="https://en.wikipedia.org/wiki/Low-level_laser_therapy/">
              photobiomodulation
            </a>
          </li>
          <li>
            trying to{" "}
            <a href="https://www.goodreads.com/user/show/103179068">read</a>{" "}
            more this year
          </li>
        </ul>
        <p className="text-sm text-ink-muted dark:text-chalk-muted mt-6">
          Last updated: Jul 27, 2026
        </p>
      </article>

      <SpotifyNowPlaying />
    </div>
  );
}
