/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  rewrites: async () => [
    {
      source: '/rss.xml',
      destination: '/api/rss',
    },
  ],
};

module.exports = nextConfig;
