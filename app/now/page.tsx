import SpotifyNowPlaying from "@/components/integrations/SpotifyNowPlaying";
import Clock from "@/components/ui/Clock";

export default function NowPage() {
  return (
    <div>
      <article className="prose">
        <p>
          this is a <a href="https://sive.rs/nowff">now</a> page
        </p>
        <p>
          📌 Miami, FL, time is <Clock />
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
        <p className="text-sm text-[#595857]/60 dark:text-[#DCDDDD]/60 mt-6">
          Last updated: Feb 22, 2026
        </p>
      </article>

      <SpotifyNowPlaying />
    </div>
  );
}
