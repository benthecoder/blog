'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

interface SearchResult {
  content: string;
  post_slug: string;
  post_title: string;
  chunk_type: string;
  metadata: {
    section: string;
    sequence: number;
    isComposite?: boolean;
    language?: string;
  };
  similarity: number;
  vector_similarity?: number;
  text_rank?: number;
  hybrid_score?: number;
}

const LoadingComponent = () => {
  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      <div className="w-48 h-1 bg-[#e6c9a8]/20 dark:bg-[#1e2030] rounded-full overflow-hidden">
        <div className="w-full h-full bg-[#927456] dark:bg-[#7aa2f7] animate-loading-bar" />
      </div>
      <span className="text-sm text-[#927456]/70 dark:text-[#7aa2f7]/70">
        Searching posts...
      </span>
    </div>
  );
};

const SearchResult = ({ result }: { result: SearchResult }) => {
  const truncateText = (text: string, maxLength: number = 150) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const formatContent = (content: string) => {
    const truncatedContent = truncateText(content);
    if (result.chunk_type === 'code') {
      return (
        <pre className="bg-[#faf4eb] dark:bg-[#1e2030] p-2 rounded text-sm overflow-x-auto mt-2">
          <code>{truncatedContent}</code>
        </pre>
      );
    }
    return (
      <p className="text-[#2c353d]/70 dark:text-[#c7cce1]/70 mt-2 text-sm">
        {truncatedContent}
      </p>
    );
  };

  return (
    <div className="group border-l-2 border-[#e6c9a8] dark:border-[#1e2030] pl-4 py-3 mb-4 hover:border-[#927456] dark:hover:border-[#7aa2f7] transition-colors hover:bg-[#faf4eb]/50 dark:hover:bg-[#1e2030]/50 rounded-r">
      <Link href={`/posts/${result.post_slug}`} className="block space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[#2c353d] dark:text-[#a9b1d6] group-hover:text-[#927456] dark:group-hover:text-[#7aa2f7] transition-colors">
            {result.post_title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[#927456]/10 dark:bg-[#7aa2f7]/10 text-[#927456] dark:text-[#7aa2f7] font-medium">
              {Math.round((result.hybrid_score ?? result.similarity) * 100)}%
              match
            </span>
          </div>
        </div>
        <div className="prose prose-sm max-w-none">
          {formatContent(result.content)}
        </div>
        <div className="text-xs text-[#927456]/70 dark:text-[#7aa2f7]/70 font-medium">
          <span className="capitalize">{result.chunk_type}</span>
          {result.metadata.section && (
            <>
              <span className="mx-2">•</span>
              <span>{result.metadata.section}</span>
            </>
          )}
        </div>
      </Link>
    </div>
  );
};

function SearchContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return searchParams.get('q') || sessionStorage.getItem('lastQuery') || '';
    }
    return '';
  });

  const [results, setResults] = useState<SearchResult[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('searchResults');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    replace(`${pathname}?${params.toString()}`);

    sessionStorage.setItem('lastQuery', query.trim());
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Search failed: ${data.error || response.statusText}`);
      }

      if (!data.results || !Array.isArray(data.results)) {
        console.warn('Unexpected response format:', data);
        setResults([]);
        return;
      }

      setResults(data.results);
      sessionStorage.setItem('searchResults', JSON.stringify(data.results));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams) {
      const urlQuery = searchParams.get('q');
      if (urlQuery && urlQuery !== query) {
        setQuery(urlQuery);
        handleSearch(new Event('submit') as any);
      }
    }
  }, [searchParams]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="w-full p-2 bg-[#fffcf7] dark:bg-[#1a1b26] border border-[#e6c9a8] dark:border-[#1e2030] rounded-lg focus:ring-2 focus:ring-[#927456] dark:focus:ring-[#7aa2f7] focus:border-transparent text-[#2c353d] dark:text-[#c7cce1] placeholder-gray-400 dark:placeholder-gray-500"
        />
      </form>

      {isLoading && <LoadingComponent />}
      {error && (
        <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
      )}
      <div className="space-y-6">
        {results.map((result, index) => (
          <SearchResult key={index} result={result} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="w-48 h-1 bg-[#e6c9a8]/20 dark:bg-[#1e2030] rounded-full overflow-hidden">
              <div className="w-full h-full bg-[#927456] dark:bg-[#7aa2f7] animate-loading-bar" />
            </div>
            <span className="text-sm text-[#927456]/70 dark:text-[#7aa2f7]/70">
              Loading search...
            </span>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
