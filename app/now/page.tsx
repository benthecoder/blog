"use client";
import { useState, useEffect } from "react";
import SpotifyNowPlaying from "@/components/integrations/SpotifyNowPlaying";

const TIMEZONE = "America/New_York";

const AboutPage = () => {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    // Set initial time
    setTime(getTimeInTimezone(TIMEZONE));

    // Update time every second
    const intervalId = setInterval(() => {
      setTime(getTimeInTimezone(TIMEZONE));
    }, 1000);

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  function getTimeInTimezone(timezone: string): string {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: timezone,
      hour12: true, // Use 24-hour format
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  return (
    <div>
      <article className="prose">
        <p>
          this is a <a href="https://sive.rs/nowff">now</a> page
        </p>
        <p>📌 Miami, FL, time is {time}</p>
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
};

export default AboutPage;
