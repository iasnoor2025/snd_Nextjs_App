import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // Add configuration to handle Prisma better in development
  serverRuntimeConfig: {
    // Will only be available on the server side
    prisma: {
      // Disable query logging in production
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    },
  },
  // Add environment variables that should be available on both client and server
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
