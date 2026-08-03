// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  reactStrictMode: true,
};

export default nextConfig;