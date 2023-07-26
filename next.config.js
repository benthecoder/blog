/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  rewrites: async () => [
    {
      source: '/rss.xml',
      destination: '/api/rss',
    },
  ],
};

module.exports = nextConfig;
