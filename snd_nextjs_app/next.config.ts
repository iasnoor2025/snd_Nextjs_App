import type { NextConfig } from "next";
import { DefinePlugin } from "webpack";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'react-hook-form',
      'zod'
    ],
    // Memory optimization settings for build
    workerThreads: false,
  },
  serverExternalPackages: ['pg'],
  // Disable static export for API routes and dynamic pages
  trailingSlash: false,
  webpack: (config, { dev, isServer }) => {
    // Add webpack plugins to handle global variables
    config.plugins.push(
      new DefinePlugin({
        'self': 'globalThis',
        'global': 'globalThis',
      })
    );

    // Handle client-side only libraries
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'jsdom': 'jsdom',
      });
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      // Add fallbacks for Node.js modules that might be imported
      dns: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      // Add fallbacks for browser globals
      'self': false,
      'window': false,
      'document': false,
    };
    
    // Memory-optimized webpack configuration
    if (!dev) {
      // Production build optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              enforce: true,
            },
            // Split large packages to reduce memory usage
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 10,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              priority: 5,
            },
          },
        },
        // Disable expensive optimizations during build
        concatenateModules: false,
        usedExports: false,
        sideEffects: false,
      };
    } else {
      // Development optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'async',
              priority: -10,
              enforce: true,
            },
          },
        },
        concatenateModules: false,
        usedExports: false,
        sideEffects: false,
      };
    }

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
  // Build optimization to reduce memory usage
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Disable telemetry during build
  telemetry: false,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
