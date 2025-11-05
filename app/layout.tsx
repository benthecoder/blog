import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";

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
      path: "../public/fonts/AveriaSerifLibre-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/AveriaSerifLibre-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-averia",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${averia.variable} font-serif`}
    >
      <body className="flex flex-col mx-2 md:mx-10 md:flex-row md:items-start md:mt-10">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
