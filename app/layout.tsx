import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import ThemeSwitch from "@/components/ui/ThemeSwitch";
import PaletteSwitch from "@/components/ui/PaletteSwitch";
import SearchModal from "@/components/ui/SearchModal";
import { FloatingControls } from "@/components/layout/FloatingControls";
import { RandomPostListener } from "@/components/layout/RandomPostListener";
import SafariEdges from "@/components/layout/SafariEdges";

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
});

export const viewport: Viewport = {
  viewportFit: "cover",
  // Pre-hydration value (the light top edge). SafariEdges keeps the
  // theme-color meta in sync with the painted top edge at runtime.
  themeColor: "#f3f3f2",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${averia.variable} font-serif`}
    >
      <body className="antialiased">
        <Providers>
          <FloatingControls>
            <PaletteSwitch />
            <ThemeSwitch />
          </FloatingControls>
          <SearchModal />
          <RandomPostListener />
          <SafariEdges />
          {children}
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
