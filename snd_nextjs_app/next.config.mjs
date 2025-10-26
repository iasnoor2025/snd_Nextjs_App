/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporarily disable TypeScript validation
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Optimize package imports
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      'lucide-react',
      'recharts'
    ],
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    resolveAlias: {
      "@tanstack/query-core/build/modern": "@tanstack/query-core/build/legacy",
      "@tanstack/react-query/build/modern": "@tanstack/react-query/build/legacy",
    },
  },

  // Bundle optimization - Enhanced for better performance
  compress: true,
  poweredByHeader: false,
  
  // Enhanced webpack configuration for better bundle splitting
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunks for better caching
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Common chunks for shared code
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
        // UI library chunks
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 8,
        },
        // Chart library chunks
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          name: 'charts',
          chunks: 'all',
          priority: 7,
        },
      },
    };

    // Optimize module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    // Add performance hints
    config.performance = {
      hints: dev ? false : 'warning',
      maxEntrypointSize: 512000, // 500KB
      maxAssetSize: 512000, // 500KB
    };

    return config;
  },
  
  // Image optimization - Enhanced for performance
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // Cache for 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: [], // Add your image domains here if needed
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Enable image optimization for better performance
    unoptimized: false,
  },

  // Environment variables - ensure ERPNext variables are available in production
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
    // Ensure these are available at build time and runtime
    NEXT_PUBLIC_ERPNEXT_URL: process.env.NEXT_PUBLIC_ERPNEXT_URL,
    NEXT_PUBLIC_ERPNEXT_API_KEY: process.env.NEXT_PUBLIC_ERPNEXT_API_KEY,
    NEXT_PUBLIC_ERPNEXT_API_SECRET: process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET,
  },

  // Transpile packages
  transpilePackages: [
    "jspdf",
    "html2canvas",
    "pdf-lib",
    "puppeteer",
  ],

  // Webpack configuration for compatibility and performance
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    
    // Let Next.js handle tree shaking optimizations to avoid cache conflicts
    // Removed usedExports setting as it conflicts with Next.js caching
    
    return config;
  },

  // Force conservative browser targets
  compiler: {
    // Ensure we don't use modern JS features that might cause syntax errors
    styledComponents: false,
  },

  // Server external packages
  serverExternalPackages: ["pg"],

  // Output configuration
  output: 'standalone',

  // Trailing slash for better SEO
  trailingSlash: false,

  // React strict mode for better development
  reactStrictMode: true,
};

export default nextConfig;
