import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  outputFileTracingExcludes: {
    "*": ["public/**/*", ".git/**/*"],
    "/posts": ["public/**/*"],
    "/posts/[slug]": ["public/**/*"],
    "/tags": ["public/**/*"],
    "/tags/[slug]": ["public/**/*"],
    "/api/**": ["public/**/*"],
  },
  rewrites: async () => [
    {
      source: "/rss.xml",
      destination: "/api/rss",
    },
  ],
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
  staticPageGenerationTimeout: 1000,
  env: {
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
};

export default nextConfig;
