import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css';

import { AnalyticsWrapper } from '../components/analytics';

export const metadata: Metadata = {
  title: 'benneo',
  description: 'Developer, writer, data scientist',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const Sidebar = (
    <div className='flex flex-col items-center md:items-end md:w-52'>
      <div>
        <Link href='/'>
          <h2 className='text-black font-semibold'>BENEDICT NEO</h2>
        </Link>
      </div>
      <div className='text-slate-500 flex flex-row space-x-3 md:flex-col md:mt-10 md:items-end'>
        <Link href='/t'>💭</Link>
        <Link href='/hn'>hn</Link>
        <Link href='/tags'>tags</Link>
        <Link href='/links'>links</Link>
        <Link href='/posts'>archive</Link>
        <Link href='/about'>whoami</Link>
      </div>
    </div>
  );

  return (
    <html lang='en'>
      <head>
        <link
          rel='icon'
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌊</text></svg>"
        />
      </head>
      <body className='max-w-3xl font-cormorant flex flex-col mb-40 mx-auto mt-4 md:flex-row md:mt-20'>
        {Sidebar}
        <main className='flex-auto text-sm min-w-0 max-w-lg mt-10 md:mt-0 px-8 md:pl-20'>
          {children}
        </main>
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
