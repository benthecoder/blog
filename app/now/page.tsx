"use client";
import React, { useState, useEffect } from "react";
import SpotifyNowPlaying from "@/components/integrations/SpotifyNowPlaying";

const TIMEZONE = "America/Chicago";

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
        <p>📌 Austin, TX, time is {time}</p>
        <ul className="list-disc">
          <li>
            building cool stuff for AI in healthcare @{" "}
            <a href="https://openevidence.com">OpenEvidence</a>
          </li>
          <li>finding balance in life and work and trying to sleep more</li>
          <li>
            experimenting with{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/38309304/">
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
          Last updated: Sep 26, 2025
        </p>
      </article>

      <SpotifyNowPlaying />
    </div>
  );
};

export default AboutPage;
