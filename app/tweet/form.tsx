'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function Form() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  const [remainingChars, setRemainingChars] = useState(280);

  const isMutating = isFetching || isPending;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsFetching(true);

    const form = e.currentTarget;
    const input = form.elements.namedItem('entry') as HTMLInputElement;

    const res = await fetch('/api/tweets', {
      body: JSON.stringify({
        body: input.value,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    input.value = '';
    const { error } = await res.json();

    if (error) {
      console.log(error);
    }

    setRemainingChars(280);
    setIsFetching(false);
    startTransition(() => {
      // Refresh the current route and fetch new data from the server without
      // losing client-side browser or React state.
      router.refresh();
    });
  }

  return (
    <form
      style={{ opacity: !isMutating ? 1 : 0.7 }}
      className='relative max-w-[500px] mb-20'
      onSubmit={onSubmit}
    >
      <input
        aria-label="What's on your mind?"
        placeholder="What's on your mind?"
        disabled={isPending}
        maxLength={280}
        onChange={(e) => setRemainingChars(280 - e.target.value.length)}
        name='entry'
        type='text'
        required
        className='pl-4 pr-24 py-2 mt-1 focus:outline-none block w-full border-neutral-300 rounded-md bg-gray-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
      />
      <span className=' text-gray-600'>
        {remainingChars} characters remaining
      </span>

      <button
        className='flex items-center justify-center absolute right-1 top-1 px-2 py-1 font-medium h-8 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded w-20'
        disabled={isMutating}
        type='submit'
      >
        🌊
      </button>
    </form>
  );
}
