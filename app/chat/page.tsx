'use client';

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className=' w-full max-w-md flex flex-col stretch'>
      {messages.length > 0
        ? messages.map((m) => (
            <div key={m.id} className='whitespace-pre-wrap'>
              {m.role === 'user' ? (
                <span className='text-slate-500'>{m.content}</span>
              ) : (
                <span className='text-green-900'>{m.content}</span>
              )}
            </div>
          ))
        : null}

      <form onSubmit={handleSubmit}>
        <input
          className='bg-transparent border-none outline-none focus:ring-0 w-full max-w-md mb-8 text-slate-500'
          value={input}
          placeholder='Type something...'
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
