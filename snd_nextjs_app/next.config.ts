import type { NextConfig } from "next";
import { DefinePlugin, ProvidePlugin, IgnorePlugin } from "webpack";

// Custom webpack plugin to handle self references
class SelfReferencePlugin {
  apply(compiler: any) {
    compiler.hooks.compilation.tap('SelfReferencePlugin', (compilation: any) => {
      compilation.hooks.optimizeChunkModules.tap('SelfReferencePlugin', (chunks: any, modules: any) => {
        modules.forEach((module: any) => {
          if (module.resource && module.resource.includes('node_modules')) {
            // This is a vendor module, ensure it doesn't reference 'self'
            if (module._source && module._source._value) {
              module._source._value = module._source._value.replace(/self\./g, 'globalThis.');
            }
          }
        });
      });
    });
  }
}

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
    
    // Handle client-side libraries that expect browser APIs
    if (isServer) {
      // Server-side: Provide fallbacks for browser APIs
      config.plugins = config.plugins || [];
      config.plugins.push(
        new DefinePlugin({
          'self': 'globalThis',
          'typeof self': JSON.stringify('object'),
          'global': 'globalThis',
          'window': 'globalThis',
          'document': 'undefined',
          'navigator': 'undefined',
          'location': 'undefined',
          'localStorage': 'undefined',
          'sessionStorage': 'undefined',
        })
      );
      
      // Handle Node.js modules properly for server
      config.node = {
        __dirname: 'mock',
        __filename: 'mock',
        global: true,
      };
      
      // External packages that should not be bundled for server
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'jsdom': 'jsdom',
        // Ensure client-side libraries are not bundled for server
        'html2canvas': 'html2canvas',
        'jspdf': 'jspdf',
        'react-to-print': 'react-to-print',
      });
      
      // Fallbacks for server-side rendering
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
        assert: false,
        constants: false,
        domain: false,
        punycode: false,
        querystring: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tty: false,
        url: false,
        vm: false,
        zlib: false,
      };
      
      // Add module rules to handle client-side libraries
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        include: /node_modules/,
        use: {
          loader: 'string-replace-loader',
          options: {
            search: /self\./g,
            replace: 'globalThis.',
            flags: 'g'
          }
        }
      });
      
      // Add a more aggressive plugin to handle self references in vendor chunks
      if (!dev) {
        config.plugins.push(
          new IgnorePlugin({
            resourceRegExp: /^(canvas|jsdom)$/,
          })
        );
        
        // Add custom plugin for comprehensive self reference handling
        config.plugins.push(new SelfReferencePlugin());
      }
    } else {
      // Client-side: Handle client-only libraries
      config.plugins = config.plugins || [];
      config.plugins.push(
        new DefinePlugin({
          'self': 'self',
          'typeof self': JSON.stringify('object'),
          'global': 'globalThis',
        })
      );
      
      // Ensure client-side libraries work properly
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
        assert: false,
        constants: false,
        domain: false,
        punycode: false,
        querystring: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tty: false,
        url: false,
        vm: false,
        zlib: false,
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
            // Separate client-side libraries
            client: {
              test: /[\\/]node_modules[\\/](html2canvas|jspdf|react-to-print)[\\/]/,
              name: 'client-libs',
              priority: 30,
              chunks: 'all',
            },
          },
        },
      };
      
      // Add a plugin to handle self references in all chunks
      config.plugins.push(
        new DefinePlugin({
          'self': isServer ? 'globalThis' : 'self',
          'typeof self': JSON.stringify('object'),
          'global': 'globalThis',
        })
      );
      
      // Ensure proper module resolution for vendor chunks
      config.resolve.modules = ['node_modules'];
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.js', '.ts', '.tsx'],
      };
      
      // Add specific handling for problematic modules
      config.plugins.push(
        new IgnorePlugin({
          resourceRegExp: /^(canvas|jsdom|html2canvas|jspdf|react-to-print)$/,
          contextRegExp: /node_modules/,
        })
      );
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
