import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css';
import { Averia_Serif_Libre } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'benneo',
  description: 'Developer, writer, data scientist',
};

const averia = Averia_Serif_Libre({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-averia',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const Sidebar = (
    <aside className='flex flex-col items-center md:w-[150px]'>
      <div className='md:sticky md:top-20'>
        <div className='font-bold text-center'>
          <Link href='/'>
            <h2>BENEDICT NEO</h2>
          </Link>
        </div>
        <div className='flex flex-row space-x-3 md:flex-col md:mt-10 md:items-end'>
          <Link href='/thoughts'>💭</Link>
          <Link href='/hn'>hn</Link>
          {/*<Link href='/tldr'>tldr</Link>*/}
          <Link href='/tags'>tags</Link>
          <Link href='/links'>links</Link>
          <Link href='/goals'>goals</Link>
          <Link href='/posts'>archive</Link>
          <Link href='/about'>whoami</Link>
        </div>
      </div>
    </aside>
  );

  return (
    <html lang='en' className={`${averia.variable} font-serif`}>
      <head>
        <link
          rel='icon'
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌊</text></svg>"
        />
      </head>
      <body className='font-serif max-w-3xl flex flex-col mb-40 mx-auto mt-4 md:flex-row md:mt-20'>
        {Sidebar}
        <main className=' flex-auto text-md min-w-0 max-w-xl mt-10 md:mt-0 px-4 md:pl-20'>
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
