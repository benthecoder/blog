import type { NextConfig } from "next";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";
import { createRequire } from "node:module";
import path from "node:path";
import { prepareMapWorkerAssets } from "./utils/mapWorkerAssets";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-e85be102871845218dcda1cc49c78508.r2.dev",
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
  ],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/",
        has: [{ type: "host", value: "photos.bneo.xyz" }],
        destination: "/photos",
      },
      {
        source: "/",
        has: [{ type: "host", value: "maps.bneo.xyz" }],
        destination: "/map",
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
