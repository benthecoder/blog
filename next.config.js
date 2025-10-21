/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    //serverExternalPackages: ['sharp', 'onnxruntime-node'],
  },
  outputFileTracingExcludes: {
    "/posts": ["public/**/*"],
    "/posts/[slug]": ["public/**/*"],
  },
  rewrites: async () => [
    {
      source: "/rss.xml",
      destination: "/api/rss",
    },
  ],
  staticPageGenerationTimeout: 1000,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.DATABASE_URL,
  },
};

module.exports = nextConfig;
