import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import ThemeSwitch from "@/components/ui/ThemeSwitch";
import PaletteSwitch from "@/components/ui/PaletteSwitch";
import SearchModal from "@/components/ui/SearchModal";
import { FloatingControls } from "@/components/layout/FloatingControls";
import { RandomPostListener } from "@/components/layout/RandomPostListener";

export const metadata: Metadata = {
  metadataBase: new URL("https://bneo.xyz"),
  title: "benneo",
  description: "writing daily",
  openGraph: {
    title: "Benedict Neo",
    description: "writing daily",
    url: "https://bneo.xyz",
    siteName: "Benedict Neo",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: "Benedict Neo",
    card: "summary_large_image",
  },
};

const averia = localFont({
  src: [
    {
      path: "../public/fonts/AveriaSerifLibre-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-averia",
  display: "swap",
  // Six faces ~250KB; a page renders two or three. Unpreloaded, the browser
  // fetches only the faces the page's CSS actually uses.
  preload: false,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${averia.variable} font-serif`}
    >
      <head>
        {/* In <head> rather than metadata.alternates: pages that set their
            own alternates (every post's canonical) would replace it. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Benedict Neo"
          href="https://bneo.xyz/rss.xml"
        />
      </head>
      <body className="antialiased">
        <Providers>
          <SearchModal />
          <RandomPostListener />
          {children}
          {/* Fixed in the corner, so DOM order is only tab order: after the
              page, so the skip link is the first stop. */}
          <FloatingControls>
            <PaletteSwitch />
            <ThemeSwitch />
          </FloatingControls>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
