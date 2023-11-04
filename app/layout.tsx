import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { Averia_Serif_Libre } from 'next/font/google';
import { Sidebar } from '../components/SideBar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://bneo.xyz'),
  title: 'benneo',
  description: 'writing daily',
  openGraph: {
    title: 'Benedict Neo',
    description: 'writing daily',
    url: 'https://bneo.xyz',
    siteName: 'Benedict Neo',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
