'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, ReactNode } from 'react';
import Image from 'next/image';

interface ChatInterfaceProps {
  backgroundImage: string;
  onChangeBackgroundAction: () => void;
}

// Helper function to render Markdown links as React elements
function renderMarkdownLinks(
  text: string,
  role: 'user' | 'assistant'
): ReactNode[] {
  // Regular expression to match Markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Split the text at markdown links
  const parts = text.split(linkRegex);
  const result: ReactNode[] = [];

  // Process each part
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      // Plain text part
      if (parts[i]) {
        result.push(<span key={`text-${i}`}>{parts[i]}</span>);
      }
    } else if (i % 3 === 1) {
      // Link text part
      const linkText = parts[i];
      const linkUrl = parts[i + 1];

      if (linkText && linkUrl) {
        result.push(
          <a
            key={`link-${i}`}
            href={linkUrl}
            className={`${
              role === 'user'
                ? 'text-white underline'
                : 'text-blue-600 dark:text-blue-400 underline'
            } pointer-events-auto`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkText}
          </a>
        );
      }

      // Skip the URL part as we've already used it
      i++;
    }
  }

  return result;
}

export default function ChatInterface({
  backgroundImage,
  onChangeBackgroundAction,
}: ChatInterfaceProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only auto-scroll when a new message is added
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      // No smooth behavior to avoid scroll jacking
      messagesEndRef.current.scrollIntoView({ block: 'end' });
    }
  }, [messages.length]);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden max-w-sm mx-auto h-[85vh] max-h-[750px] flex flex-col shadow-md border border-gray-200 dark:border-gray-800 relative">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 top-[42px] bottom-[36px]">
          <Image
            src={backgroundImage}
            alt="Background artwork"
            fill
            className="opacity-30 object-scale-down"
            priority={true}
          />
        </div>
      </div>

      {/* Minimal header */}
      <div className="bg-white dark:bg-gray-900 h-[42px] flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 relative z-10">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              B
            </div>
            <span className="text-gray-600 dark:text-gray-300 text-sm font-normal">
              benedict
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onChangeBackgroundAction}
            type="button"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Change background"
            title="Change background"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
          <button
            onClick={handleClear}
            type="button"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Clear chat"
            title="Clear chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area with iMessage styling */}
      <div className="flex-1 overflow-y-auto relative z-10 p-4">
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-[#0b93f6] text-white ml-auto'
                    : 'bg-[#e5e5ea] dark:bg-[#303030] text-black dark:text-white'
                }`}
              >
                <div className="text-sm leading-relaxed break-words">
                  {renderMarkdownLinks(
                    message.content,
                    message.role === 'user' || message.role === 'assistant'
                      ? message.role
                      : 'assistant'
                  )}{' '}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user'
                      ? 'text-white/90'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatTime()}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator - only show between user message and assistant response */}
          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-[#e5e5ea] dark:bg-[#303030] rounded-lg px-4 py-2.5 user-select-none">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-middle"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-last"></div>
                  </div>
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Minimal input area */}
      <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 relative z-10 user-select-none">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-3 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none text-sm placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`${
              input.trim() ? 'bg-[#0b93f6]' : 'bg-gray-200 dark:bg-gray-700'
            } rounded-full p-2 disabled:opacity-50 transition-colors user-select-none`}
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="inline-block animate-pulse w-4 h-4 text-white user-select-none">
                •••
              </span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
