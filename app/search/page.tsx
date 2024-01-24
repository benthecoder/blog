'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  content: string;
  // Add other properties as needed
}

const LoadingComponent: React.FC = () => {
  const [loadingText, setLoadingText] = useState('🌊 ');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLoadingText((prev) => prev + '🌊 ');
    }, 777);

    return () => clearInterval(intervalId);
  }, []);

  return <p className='text-gray-600'>{loadingText}</p>;
};

const SearchPosts: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query) return;
    setIsLoading(true);

    try {
      console.log('Submitting search query:', query); // Log the query
      console.log('NEON Database URL:', process.env.NEXT_PUBLIC_DATABASE_URL);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      console.log('Response status:', response.status); // Log response status

      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data); // Log search results
        setResults(data.data);
      } else {
        console.error('Search failed with status:', response.status); // Log error with status
        const errorText = await response.text();
        console.error('Error response body:', errorText); // Log error response body
      }
    } catch (error) {
      console.error('Error during search:', error); // Log catched error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          className='bg-transparent outline-none focus:ring-0 w-full max-w-md mb-8 text-slate-500'
          value={query}
          placeholder='search...'
          onChange={handleInputChange}
        />
      </form>

      {isLoading && <LoadingComponent />}

      <div className='grid grid-cols-1'>
        {results.map((post) => (
          <div key={post.slug} className='mb-2'>
            <p className='font-bold'>
              {'> '}
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchPosts;
