'use client';
import React, { useState, useEffect } from 'react';

const TIMEZONE = 'America/Los_Angeles';

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
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      hour12: true, // Use 24-hour format
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  return (
    <div>
      <article className="prose">
        <h1>Now</h1>
        <p>
          This is a <a href="https://sive.rs/nowff">now</a> page
        </p>
        <p>based in SF, where it's currently {time}</p>
        <ul className="list-disc">
          <li>
            msds @{' '}
            <a href="https://www.usfca.edu/arts-sciences/programs/graduate/data-science">
              USF
            </a>
          </li>
          <li>ai for cancer research @ UCSF Health</li>
          <li>
            at an <a href="https://lu.ma/sf"> event</a> or hackathon
          </li>
          <li>
            learning <a href="https://github.com/benthecoder/AI">AI</a> from
            scratch
          </li>
          {/*<li>
            Starting <a href="https://lu.ma/luminarykl">Luminary</a> in KL
          </li>
          <li>
            Building{' '}
            <a href="https://benneo.notion.site/project-ideas-63bc556d83a5405da1bcd89629da2a0e?pvs=4">
              cool iOS apps
            </a>{' '}
            with{' '}
            <a href="https://twitter.com/benxneo/status/1743458106032488839">
              SwiftUI
            </a>
          </li>
            <li>Reading Funny Weather: Art in an Emergency</li>
          */}
        </ul>
        <br></br>
        <p>Last updated: Nov 23, 2024</p>
      </article>
    </div>
  );
};

export default AboutPage;
