import type { NextConfig } from "next";
import { DefinePlugin } from "webpack";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-hook-form',
      'zod',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'recharts',
      'date-fns'
    ],
  },
  
  // Handle external packages properly
  serverExternalPackages: ['pg'],
  
  // Simple, clean webpack configuration
  webpack: (config, { dev, isServer }) => {
    if (isServer) {
      // Server-side: Only essential externals
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'jsdom': 'jsdom',
      });
      
      // Minimal fallbacks - let Next.js handle the rest
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      
      // PROFESSIONAL SOLUTION: Use webpack DefinePlugin for self global
      // This is the standard, reliable way to handle global references
      config.plugins = config.plugins || [];
      config.plugins.push(
        new DefinePlugin({
          'self': 'globalThis',
          'typeof self': JSON.stringify('object'),
        })
      );
      
      // Also add alias to ensure self is resolved correctly
      config.resolve.alias = {
        ...config.resolve.alias,
        'self': 'globalThis',
      };
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
