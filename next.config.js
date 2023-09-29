/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Indicate that these packages should not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
  },
  rewrites: async () => [
    {
      source: '/rss.xml',
      destination: '/api/rss',
    },
  ],
};

module.exports = nextConfig;
