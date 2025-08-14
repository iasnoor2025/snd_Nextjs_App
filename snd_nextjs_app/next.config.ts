import type { NextConfig } from "next";
import { DefinePlugin, ProvidePlugin, IgnorePlugin } from "webpack";




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
    // Apply fixes for BOTH development and production, server and client
    console.log(`Webpack config: dev=${dev}, isServer=${isServer}`);
    
    // Only apply webpack fixes in production builds
    if (!dev) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new DefinePlugin({
          'self': 'globalThis',
          'typeof self': JSON.stringify('object'),
          'global': 'globalThis',
        })
      );
      
      config.plugins.push(
        new ProvidePlugin({
          'self': 'globalThis',
        })
      );
    }
    
    // Handle OpenTelemetry context issue only in production
    if (!dev) {
      config.externals = config.externals || [];
      config.externals.push({
        '@opentelemetry/api': 'commonjs @opentelemetry/api',
      });
      
      // Ignore problematic modules that cause self is not defined
      config.plugins.push(
        new IgnorePlugin({
          resourceRegExp: /^(canvas|jsdom)$/,
        })
      );
      
      // Control module resolution
      config.resolve.modules = ['node_modules'];
    }
    
    // Add basic alias and fallback only in production
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'self': 'globalThis',
      };
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'self': 'globalThis',
      };
    }
    
    // Handle CommonJS modules only in production builds
    if (!dev) {
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });
      
      // Ensure proper module resolution only in production
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.js', '.ts', '.tsx'],
      };
    }
    

    

    
    // Server-specific configurations only in production
    if (isServer && !dev) {
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
      
      // Server-specific: Only essential externals
      config.externals = config.externals || [];
      config.externals.push({
        'self': 'globalThis'
      });
      
      // Handle Node.js modules properly for server
      config.node = {
        __dirname: 'mock',
        __filename: 'mock',
        global: true,
      };
      
      // Ensure the DefinePlugin is applied to all chunks including vendors
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            enforce: true,
          },
        },
      };
      
      // Add a more comprehensive DefinePlugin configuration for vendor chunks (production only)
      if (!dev) {
        config.plugins.push(
          new DefinePlugin({
            'self': 'globalThis',
            'typeof self': JSON.stringify('object'),
            'global': 'globalThis',
            'window': 'globalThis',
            'document': 'undefined',
          })
        );
      }
      
      // Ensure vendor chunks get the self definition (production only)
      if (!dev) {
        config.module.rules = config.module.rules || [];
        config.module.rules.push({
          test: /\.js$/,
          include: /node_modules/,
          use: {
            loader: 'string-replace-loader',
            options: {
              search: 'self\\.',
              replace: 'globalThis.',
              flags: 'g'
            }
          }
        });
      }
      
      // More aggressive externals handling for vendor chunks (production only)
      if (!dev) {
        config.externals = config.externals || [];
        config.externals.push({
          'self': 'globalThis',
          'window': 'globalThis',
          'document': 'undefined',
        });
      }
      
      // Ensure the DefinePlugin is applied to vendor chunks (production only)
      if (!dev) {
        config.plugins.push(
          new DefinePlugin({
            'self': 'globalThis',
            'typeof self': JSON.stringify('object'),
            'global': 'globalThis',
            'window': 'globalThis',
            'document': 'undefined',
            'navigator': 'undefined',
          })
        );
      }
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
