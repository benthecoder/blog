import type { NextConfig } from "next";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";
import { createRequire } from "node:module";
import path from "node:path";
import { IMAGE_REMOTE_HOST } from "./config/site";
import { prepareMapWorkerAssets } from "./utils/mapWorkerAssets";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  poweredByHeader: false,
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: IMAGE_REMOTE_HOST,
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Limit generated variants to the sizes and qualities the site uses.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [256, 384],
    qualities: [65, 75],
    minimumCacheTTL: 31536000,
  },

  outputFileTracingExcludes: {
    "*": ["public/**/*", ".git/**/*"],
    "/api/**": ["app/og/*.jpg"],
  },
  redirects: async () => [
    { source: "/gallery", destination: "/photos", permanent: true },
    { source: "/photos/trips", destination: "/photos/places", permanent: true },
    // The UMAP plot of post embeddings moved into the knowledge map on /start.
    { source: "/viz", destination: "/start", permanent: true },
  ],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/",
        has: [{ type: "host", value: "photos.bneo.xyz" }],
        destination: "/photos",
      },
      {
        source: "/rss.xml",
        has: [{ type: "host", value: "photos.bneo.xyz" }],
        destination: "/photos/rss.xml",
      },
      {
        source: "/",
        has: [{ type: "host", value: "maps.bneo.xyz" }],
        destination: "/map",
      },
      {
        source: "/robots.txt",
        has: [{ type: "host", value: "photos.bneo.xyz" }],
        destination: "/photos/robots.txt",
      },
      {
        source: "/sitemap.xml",
        has: [{ type: "host", value: "photos.bneo.xyz" }],
        destination: "/photos/sitemap.xml",
      },
      {
        source: "/robots.txt",
        has: [{ type: "host", value: "maps.bneo.xyz" }],
        destination: "/map/robots.txt",
      },
      {
        source: "/sitemap.xml",
        has: [{ type: "host", value: "maps.bneo.xyz" }],
        destination: "/map/sitemap.xml",
      },
    ],
    afterFiles: [
      {
        source: "/rss.xml",
        destination: "/api/rss",
      },
      // Published images live in R2. This runs after the public/ file check,
      // so local files (e.g. /images/drafts/*) still win when present.
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              source: "/images/:path*",
              destination: `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/images/:path*`,
            },
          ]
        : []),
    ],
    fallback: [],
  }),
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // React dev mode needs eval() to rebuild server callstacks; prod never uses it.
            `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            // /hn reads Hacker News' public API straight from the browser.
            "connect-src 'self' https://tiles.openfreemap.org https://va.vercel-scripts.com https://vitals.vercel-insights.com https://hacker-news.firebaseio.com",
            "worker-src 'self' blob:",
            "frame-src 'self' https:",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join("; "),
        },
      ],
    },
    {
      // Self-hosted map styles (see #124): a snapshot that changes ~never,
      // fetched on the map's critical path — cache it like the other statics
      // instead of revalidating against the origin on every visit.
      source: "/map-styles/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
    {
      source: "/fonts/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/icons/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/images/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, s-maxage=86400, stale-while-revalidate=2592000",
        },
      ],
    },
    {
      source: "/data/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, s-maxage=86400, stale-while-revalidate=2592000",
        },
      ],
    },
  ],
};

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    prepareMapWorkerAssets(
      createRequire(import.meta.url).resolve("maplibre-gl/package.json"),
      path.join(process.cwd(), "public")
    );
  }
  return nextConfig;
}
