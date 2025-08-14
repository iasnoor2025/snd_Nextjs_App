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
      'zod',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'recharts',
      'date-fns'
    ],
    workerThreads: false,
  },
  serverExternalPackages: ['pg'],
  trailingSlash: false,
  webpack: (config, { dev, isServer }) => {
    // Add bundle analyzer
    if (!dev) {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './bundle-analysis.html',
        })
      );
    }

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
      'self': false,
      'window': false,
      'document': false,
    };
    
    // Production build optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000,
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
              chunks: 'all',
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 10,
              chunks: 'all',
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              priority: 5,
              chunks: 'all',
            },
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
              name: 'charts',
              priority: 5,
              chunks: 'all',
            },
            forms: {
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
              name: 'forms',
              priority: 5,
              chunks: 'all',
            },
            tables: {
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              name: 'tables',
              priority: 5,
              chunks: 'all',
            },
          },
        },
        concatenateModules: true,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  },
  serverRuntimeConfig: {
    prisma: {
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    },
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  compress: true,
  poweredByHeader: false,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 4,
  },
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
