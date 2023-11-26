'use client';
import React, { useEffect, useState } from 'react';

const timeSince = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  const days = Math.floor(diffInSeconds / (3600 * 24));
  const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);

  if (days > 1) {
    return `${days} days ago`;
  } else if (days === 1) {
    return '1 day ago';
  } else if (hours > 1) {
    return `${hours} hours ago`;
  } else if (hours === 1) {
    return '1 hour ago';
  } else if (minutes > 1) {
    return `${minutes} minutes ago`;
  } else if (minutes === 1) {
    return '1 minute ago';
  } else {
    return 'less than a minute ago';
  }
};

export default function Page() {
  const Curius = () => {
    const [links, setLinks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchLinks = async () => {
      setIsLoading(true);
      const response = await fetch('api/curius');
      const data = await response.json();
      setLinks(data.data.links);
      setIsLoading(false);
    };

    useEffect(() => {
      fetchLinks();
    }, []);

    return (
      <div>
        <p className='mb-10'>
          Links I saved on{' '}
          <a href='https://curius.app/benedict-neo' className='underline'>
            Curius
          </a>{' '}
        </p>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ul className='pl-1 list-outside list-disc'>
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.link}
                  target='_blank'
                  rel='noopener noreferrer'
                  className=' underline'
                >
                  {link.title}
                </a>
                <span className='pl-1 text-gray-500'>
                  {timeSince(link.createdDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className='font-bold text-left mb-10 text-2xl'> Links</h1>
      <Curius />
    </div>
  );
}
