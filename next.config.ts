import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  poweredByHeader: false,
  images: {
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
  rewrites: async () => [
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

export default nextConfig;
