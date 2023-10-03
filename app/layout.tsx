import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { Averia_Serif_Libre } from 'next/font/google';
import Link from 'next/link';
import { Sidebar } from '../components/SideBar';
import './globals.css';

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
  return (
    <html lang='en' className={`${averia.variable} font-serif`}>
      <head>
        <link
          rel='icon'
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌊</text></svg>"
        />
      </head>
      <body className='font-serif max-w-3xl flex flex-col mb-40 mx-auto mt-4 md:flex-row md:mt-20'>
        <Sidebar />
        <main className=' flex-auto text-md min-w-0 max-w-xl mt-10 md:mt-0 px-4 md:pl-20'>
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
