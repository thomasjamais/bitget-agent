/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  // Enable WebSocket support in development
  async rewrites() {
    return [
      {
        source: "/api/ws/:path*",
        destination: "http://localhost:8081/api/ws/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
