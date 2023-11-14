'use client';

import React, { useState } from 'react';
import Markdown from 'markdown-to-jsx';

const Summarize: React.FC = () => {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setContent('');

    try {
      const response = await fetch('/api/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const { text } = await response.json();

        const summaryResponse = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: text }),
        });

        if (summaryResponse.ok) {
          if (summaryResponse.status === 400) {
            setContent('Article is too long, cannot summarize');
            return;
          }
          if (summaryResponse.body) {
            const reader = summaryResponse.body.getReader();
            const decoder = new TextDecoder();
            let summary = '';
            let done = false;

            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              summary += decoder.decode(value);

              setContent(summary);
            }
          }
        } else {
          setContent(
            'Error generating summary, not article/article is too long'
          );
          console.error('Error getting summary from OpenAI API');
        }
      } else {
        console.error('Error fetching and extracting content');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className='text-2xl font-bold'>TL;DR</h1>
      <p className='mb-2'>Summarizing articles using ChatGPT API</p>
      <form className='relative max-w-[500px] mb-10' onSubmit={handleSubmit}>
        <input
          type='text'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder='Enter article URL'
          aria-label='Enter article URL'
          name='entry'
          required
          className='pl-4 pr-24 py-2 mt-1 focus:outline-none block w-full border-neutral-300 rounded-md bg-gray-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
        />
        <button
          type='submit'
          className='flex items-center justify-center absolute right-1 top-1 px-2 py-1 font-medium h-8 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded w-20'
        >
          Read
        </button>
      </form>
      {content && (
        <div>
          <Markdown>{content}</Markdown>
        </div>
      )}
    </div>
  );
};

export default Summarize;
