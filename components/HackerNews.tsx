'use client';

import React, { useEffect, useState } from 'react';

const HackerNews = () => {
  const [topStories, setTopStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const postsPerPage = 50;
  const maxPages = 10;

  const fetchIDs = async () => {
    const response = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json'
    );
    const data = await response.json();
    return data;
  };

  const fetchStory = async (id: number) => {
    const response = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`
    );
    const data = await response.json();
    return data;
  };

  const fetchTopStories = async () => {
    setIsLoading(true);
    const stories = await fetchIDs();
    const startIndex = currentPage * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentStories = stories.slice(startIndex, endIndex);
    const fetchedStories = await Promise.all(
      currentStories.map((storyId) => fetchStory(storyId))
    );
    setTopStories(fetchedStories);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTopStories();
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < maxPages - 1) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handleBackPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <ul className='pl-1 list-outside list-disc'>
            {topStories.map((story) => (
              <li key={story.id} className='underline'>
                <a href={story.url} target='_blank' rel='noopener noreferrer'>
                  {story.title}
                </a>
              </li>
            ))}
          </ul>
          <div className='mt-10'>
            {currentPage < maxPages - 1 && (
              <div className='space-x-10'>
                {currentPage > 0 && (
                  <button onClick={handleBackPage} className='underline'>
                    Back
                  </button>
                )}
                <button onClick={handleNextPage} className='underline'>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HackerNews;
