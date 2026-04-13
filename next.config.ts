import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // `tsc --noEmit` is part of verification; skip Next's internal worker-based
    // typecheck because it fails with `spawn EPERM` in this Windows environment.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        // TODO: Replace with your specific CloudFront distribution domain
        // e.g., 'd1234567890.cloudfront.net'
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  experimental: {
    optimizeCss: true,
    workerThreads: true,
    cpus: 1,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://unpkg.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss: https://*.clerk.accounts.dev https://*.clerk.com; worker-src 'self' blob:; frame-src 'self' https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com; font-src 'self' data: https:;"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
