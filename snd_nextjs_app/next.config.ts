import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    // Optimized webpack configuration for better performance
    config.optimization = {
      ...config.optimization,
      // Better chunk splitting for faster loading
      splitChunks: {
        chunks: 'async',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          // Vendor chunks for better caching
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'async',
            priority: -10,
          },
        },
      },
      // Enable module concatenation for better performance
      concatenateModules: !dev,
    };

    // Add performance hints for development
    if (dev) {
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      };
    }
    
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
  // Optimized memory management settings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000, // Increased to 1 minute
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4, // Increased for better performance
  },
  // Add performance optimizations
  swcMinify: true,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
