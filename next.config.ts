import type { NextConfig } from "next";

const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? "3100";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Performance optimizations
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
  // Compression
  compress: true,
  
  // Experimental features for performance
  experimental: {
    externalDir: false,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
    ],
  },
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/super-admin/**'],
    };
    
    // Exclude test files from build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  allowedDevOrigins: [
    `http://localhost:3000`,
    `http://127.0.0.1:3000`,
    `http://127.0.0.1:${PLAYWRIGHT_PORT}`,
    `http://localhost:${PLAYWRIGHT_PORT}`,
  ],
  env: {
    NEXT_PUBLIC_E2E: process.env.NEXT_PUBLIC_E2E ?? process.env.E2E ?? "false",
  },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
