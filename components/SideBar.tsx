'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { path: '/thoughts', text: '💭' },
  { path: '/hn', text: 'hn' },
  //{ path: '/chat', text: 'chat' },
  { path: '/now', text: 'now' },
  { path: '/library', text: 'library' },
  { path: '/posts', text: 'archive' },
  { path: '/contact', text: 'say hi' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className='flex flex-col items-center md:w-[150px]'>
      <div className='md:sticky md:top-20'>
        <div className='font-bold text-center'>
          <Link href='/'>
            <h2>BENEDICT NEO</h2>
          </Link>
        </div>
        <div className='flex flex-row space-x-3 md:flex-col md:mt-10 md:items-end'>
          {links.map(({ path, text }) => (
            <Link
              key={path}
              href={path}
              className={
                pathname === path ? 'text-gray-500' : 'hover:underline'
              }
            >
              {text}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
