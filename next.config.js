/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    //serverExternalPackages: ['sharp', 'onnxruntime-node'],
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
