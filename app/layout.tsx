import Link from 'next/link';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const Sidebar = (
    <div className='flex flex-col items-center'>
      <div>
        <Link href='/'>
          <h2 className=' text-black text-center'>BENEDICT NEO</h2>
        </Link>
      </div>
      <div className='text-slate-500 flex flex-row space-x-3 md:flex-col md:justify-center md:w-full md:items-end md:mt-10'>
        <Link href='/links'>Links</Link>
        <Link href='/about'>About</Link>
      </div>
    </div>
  );

  return (
    <html lang='en'>
      <body className='max-w-3xl font-cormorant mb-40 flex flex-col mx-auto md:flex-row mt-4 md:mt-20 lg:mt-20'>
        {Sidebar}
        <main className='flex-auto text-sm min-w-0 mx-6 mt-4 md:mt-0 flex flex-col px-10 md:px-10'>
          {children}
        </main>
      </body>
    </html>
  );
}
