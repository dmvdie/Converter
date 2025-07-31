/** @type {import('next').NextConfig} */

const nextConfig = {
  // ...existing config options...
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
};

module.exports = nextConfig;
