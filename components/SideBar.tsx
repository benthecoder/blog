'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeSwitch from './ThemeSwitch';
const links = [
  { path: '/thoughts', text: '💭' },
  { path: '/hn', text: 'hn' },
  { path: '/now', text: 'now' },
  { path: '/curius', text: 'curius' },
  { path: '/sketch', text: 'sketch' },
  { path: '/library', text: 'library' },
  { path: '/posts', text: 'archive' },
  { path: '/contact', text: 'say hi' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <div className='md:sticky md:top-10 flex flex-col items-center mb-10'>
      <div>
        <div className='font-bold text-center md:text-left mt-4 md:mt-0'>
          <Link href='/'>
            <h2>BENEDICT NEO</h2>
          </Link>
        </div>

        <div className='flex flex-row space-x-3 md:flex-col md:mt-10 md:space-x-0'>
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
          <ThemeSwitch />
        </div>
      </div>
    </div>
  );
}
