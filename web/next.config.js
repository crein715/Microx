/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media*.giphy.com',
      },
      {
        protocol: 'https',
        hostname: 'i.giphy.com',
      },
    ],
  },
}

module.exports = nextConfig
