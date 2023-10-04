'use client';
import React, { useState, useEffect } from 'react';

const TIMEZONE = 'America/Chicago';

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
      hour12: true,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  return (
    <div>
      <article className='prose'>
        <h1>Now</h1>
        <p>Based in Ames, Iowa, where it's currently {time}</p>
        <p>
          This is a <a href='https://sive.rs/nowff'>now</a> page
        </p>
        <ul className='list-disc'>
          <li>In my last semester @ Iowa State University</li>
          <li>
            Starting to write articles on{' '}
            <a href='https://benedictxneo.medium.com/'>Medium</a> again
          </li>
          <li>
            Learning C/C++ by building a{' '}
            <a href='https://viewsourcecode.org/snaptoken/kilo/index.html'>
              text editor
            </a>
          </li>
          <li>Reading The Conquest of Happiness by Bertrand Russell</li>
          <li>Applying to grad school</li>
          <li>Thinking about ways to cure GERD</li>
        </ul>
        <br></br>
        <p>Last updated: Oct 4, 2023</p>
      </article>
    </div>
  );
};

export default AboutPage;
