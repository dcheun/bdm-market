/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
        pathname: '**',
        port: '3000',
        protocol: 'http',
      },
      {
        hostname: '127.0.0.1',
        pathname: '**',
        port: '3000',
        protocol: 'http',
      },
      {
        hostname: 'bdm-market.bigdymedia.com',
        pathname: '**',
        protocol: 'https',
      },
    ],
  },
}

module.exports = nextConfig
