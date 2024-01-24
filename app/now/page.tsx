'use client';
import React, { useState, useEffect } from 'react';

const TIMEZONE = 'Asia/Singapore';

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
      <article className='prose'>
        <h1>Now</h1>
        <p>Based in KL, Malaysia, where it's currently {time}</p>
        <p>
          This is a <a href='https://sive.rs/nowff'>now</a> page
        </p>
        <ul className='list-disc'>
          <li>
            Recently graduated from Iowa State University, going back grad
            school in the Fall of 2024 (location TBD)
          </li>
          <li>
            Starting <a href='https://lu.ma/luminarykl'>Luminary</a> in KL
          </li>
          <li>Learning SwiftUI to build cool iOS apps</li>
          <li>
            Learning <a href='https://github.com/benthecoder/AI'>AI</a> from
            scratch
          </li>
          <li>Reading Man's Search for Meaning</li>
        </ul>
        <br></br>
        <p>Last updated: Jan 24, 2024</p>
      </article>
    </div>
  );
};

export default AboutPage;
