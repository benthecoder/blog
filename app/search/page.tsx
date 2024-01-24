'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  content: string;
  // Add other properties as needed
}

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
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data);
      } else {
        console.error('Search failed');
      }
    } catch (error) {
      console.error('Error during search:', error);
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

      {isLoading && <p className='text-gray-600'>crunching the numbers...</p>}

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
