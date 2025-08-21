/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Keep disabled for now
  },
  typescript: {
    ignoreBuildErrors: true, // Keep disabled until we fix remaining issues
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Ensure aliases also apply when using Turbopack in dev
    turbo: {
      resolveAlias: {
        "@tanstack/query-core/build/modern": "@tanstack/query-core/build/legacy",
        "@tanstack/react-query/build/modern": "@tanstack/react-query/build/legacy",
      },
    },
  },

  // Bundle optimization
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
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

  // Webpack configuration for compatibility
  webpack: (config) => {
    // Add any additional webpack configuration if needed
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
