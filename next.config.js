/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
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
  staticPageGenerationTimeout: 1000,
  env: {
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
};

module.exports = nextConfig;
