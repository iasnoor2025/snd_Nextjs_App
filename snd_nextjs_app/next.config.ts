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
    
    // Simplified webpack optimization to avoid SSR issues
    config.optimization = {
      ...config.optimization,
      // Remove problematic vendor chunk splitting for SSR
      splitChunks: {
        chunks: 'async', // Only split async chunks to avoid SSR issues
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
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
  // Add performance optimizations
  compress: true,
  poweredByHeader: false,
  // Add memory management settings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

export default nextConfig;
