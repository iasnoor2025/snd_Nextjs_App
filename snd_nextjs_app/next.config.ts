import type { NextConfig } from "next";

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
    // Memory optimization settings for build
    workerThreads: false,
  },
  serverExternalPackages: ['pg'],
  // Disable static export for API routes and dynamic pages
  trailingSlash: false,
  webpack: (config, { dev, isServer }) => {
    // Handle client-side only libraries
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'jsdom': 'jsdom',
      });
      
      // Handle module compatibility on the server
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Only add fallbacks that don't interfere with Next.js internals
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
      };
    } else {
      // Client-side fallbacks can include more aggressive handling
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
        // Add fallbacks for browser globals
        'self': false,
        'window': false,
        'document': false,
      };
    }

    // Memory-optimized webpack configuration
    if (!dev) {
      // Production build optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            // Vendor chunk splitting
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            // React and Next.js specific chunks
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              chunks: 'all',
            },
            next: {
              test: /[\\/]node_modules[\\/](next)[\\/]/,
              name: 'next',
              priority: 15,
              chunks: 'all',
            },
            // UI component libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
              name: 'ui',
              priority: 5,
              chunks: 'all',
            },
            // Form and validation libraries
            forms: {
              test: /[\\/]node_modules[\\/](@hookform|react-hook-form|zod)[\\/]/,
              name: 'forms',
              priority: 5,
              chunks: 'all',
            },
            // Data fetching and state management
            data: {
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              name: 'data',
              priority: 5,
              chunks: 'all',
            },
            // Charts and visualization
            charts: {
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              name: 'charts',
              priority: 5,
              chunks: 'all',
            },
            // Date handling
            dates: {
              test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
              name: 'dates',
              priority: 5,
              chunks: 'all',
            },
            // Database and ORM
            database: {
              test: /[\\/]node_modules[\\/](drizzle-orm|pg)[\\/]/,
              name: 'database',
              priority: 5,
              chunks: 'all',
            },
            // Authentication
            auth: {
              test: /[\\/]node_modules[\\/](next-auth|bcryptjs)[\\/]/,
              name: 'auth',
              priority: 5,
              chunks: 'all',
            },
            // File handling
            files: {
              test: /[\\/]node_modules[\\/](formidable|@aws-sdk)[\\/]/,
              name: 'files',
              priority: 5,
              chunks: 'all',
            },
            // PDF and document generation
            documents: {
              test: /[\\/]node_modules[\\/](jspdf|html2canvas)[\\/]/,
              name: 'documents',
              priority: 5,
              chunks: 'all',
            },
            // Drag and drop
            dnd: {
              test: /[\\/]node_modules[\\/](@dnd-kit)[\\/]/,
              name: 'dnd',
              priority: 5,
              chunks: 'all',
            },
            // Tables
            tables: {
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              name: 'tables',
              priority: 5,
              chunks: 'all',
            },
            // Split large API routes and middleware
            api: {
              test: /[\\/]app[\\/]api[\\/]/,
              name: 'api',
              priority: 5,
              chunks: 'all',
              minSize: 10000,
            },
            // Split middleware and edge runtime
            middleware: {
              test: /[\\/](middleware|edge-runtime)[\\/]/,
              name: 'middleware',
              priority: 5,
              chunks: 'all',
              minSize: 10000,
            },
          },
        },
        // Enable some optimizations in development for better chunk splitting
        concatenateModules: false, // Keep false for development
        usedExports: false, // Keep false for development
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
      
      // Add development-specific optimizations
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            // Force smaller chunks in development
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
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
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
