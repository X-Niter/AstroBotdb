/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@astrobot/ui"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:5000"]
    },
  },
  images: {
    domains: ["cdn.discordapp.com", "ui-avatars.com"],
  },
}

module.exports = nextConfig