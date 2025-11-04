import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { i18n } from '@/lib/i18n-config';

/**
 * Next.js 16 Middleware
 * Compatible with Next.js 16 and Auth.js v5 (next-auth@5.0.0-beta.30)
 * Handles authentication, authorization, and internationalization routing
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware triggered for path:', pathname);
  }

  // Allow static files from public folder (images, fonts, etc.)
  const staticFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot'];
  if (staticFileExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Define public routes that should bypass middleware completely
  const publicRoutes = [
    '/login',
    '/signup', 
    '/forgot-password',
    '/reset-password',
    '/auth',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/access-denied',
    '/debug-permissions',
    '/api/debug-auth',
    '/api/timesheets/auto-generate', // Allow timesheet auto-generation
    '/api/rbac/initialize', // Allow RBAC initialization and status check
    // Public H2S card viewing (QR should not require login)
    '/h2s-card',
  ];

  // Define static assets
  const staticAssets = [
    '/images',
    '/icons',
    '/fonts',
    '/css',
    '/js',
    '/api-docs',
  ];

  // Check if it's a public route or static asset
  if (publicRoutes.some(route => pathname.startsWith(route)) ||
      staticAssets.some(asset => pathname.startsWith(asset))) {
    return NextResponse.next();
  }

  // Check if it's a locale-specific public route (e.g., /en/signup, /ar/forgot-password)
  const localeSpecificPublicRoutes = publicRoutes.flatMap(route => 
    i18n.locales.map(locale => `/${locale}${route}`)
  );
  
  // Check for both exact matches and path starts with
  if (localeSpecificPublicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Handle auth-related routes with locale prefixes
  if (pathname === '/en/login' || pathname === '/ar/login') {
    return NextResponse.next();
  }
  
  if (pathname === '/en/signup' || pathname === '/ar/signup') {
    return NextResponse.next();
  }
  
  if (pathname === '/en/forgot-password' || pathname === '/ar/forgot-password') {
    return NextResponse.next();
  }
  
  if (pathname === '/en/reset-password' || pathname === '/ar/reset-password') {
    return NextResponse.next();
  }

  // Redirect non-locale auth routes to locale-prefixed versions
  if (pathname === '/login') {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (pathname === '/signup') {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}/signup`, request.url));
  }

  if (pathname === '/forgot-password') {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}/forgot-password`, request.url));
  }

  if (pathname === '/reset-password') {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}/reset-password`, request.url));
  }

  // Check if it's an API route that should bypass middleware
  // Bypass ALL API routes - they handle their own auth and don't need locale prefixes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Also bypass locale-prefixed API routes (e.g., /en/modules/reporting/api/reports)
  // These should be treated as API routes, not locale routes
  if (pathname.includes('/api/')) {
    return NextResponse.next();
  }

  // Handle locale routing first (only for non-public routes)
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale: string) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  try {
    // Get the token from the request (Auth.js v5 compatible)
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret'
    });

    // Check if session cookie exists even if token is null (might be during login redirect)
    const sessionCookie = request.cookies.get('next-auth.session-token');
    const hasSessionCookie = !!sessionCookie?.value;

    // If no token and no session cookie, redirect to login
    if (!token && !hasSessionCookie) {
      // Prevent redirect loops - don't redirect if we're already on login page
      if (pathname.includes('/login')) {
        return NextResponse.next();
      }
      
      // Get the current locale from the pathname
      const currentLocale = pathname.split('/')[1];
      const validLocale = i18n.locales.includes(currentLocale as "en" | "ar") ? currentLocale : i18n.defaultLocale;
      const loginUrl = new URL(`/${validLocale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If we have a session cookie but no token yet (e.g., just after login), allow through
    // The session will be validated on the next request
    if (hasSessionCookie && !token) {
      return NextResponse.next();
    }

    // Check if user is active (only if we have a token)
    if (token && token.isActive === false) {
      const currentLocale = pathname.split('/')[1];
      const validLocale = i18n.locales.includes(currentLocale as "en" | "ar") ? currentLocale : i18n.defaultLocale;
      return NextResponse.redirect(new URL(`/${validLocale}/access-denied?reason=inactive`, request.url));
    }

    // Client-safe route permission checking (no database operations)
    const routePermission = getClientSafeRoutePermission(pathname);
    
    if (routePermission) {
      // If roles array is empty, only check permissions (no role restrictions)
      if (routePermission.roles.length > 0) {
        // Check if user has any of the required roles
        const userRoles = Array.isArray(token.roles) ? token.roles : [token.role || 'USER'];
        const hasRequiredRole = routePermission.roles.some(requiredRole => 
          userRoles.includes(requiredRole)
        );

        if (!hasRequiredRole) {
          const pathParts = pathname.split('/');
          const currentLocale = pathParts[1] || i18n.defaultLocale;
          const validLocale = i18n.locales.includes(currentLocale as "en" | "ar") ? currentLocale : i18n.defaultLocale;
          return NextResponse.redirect(new URL(`/${validLocale}/access-denied?reason=insufficient_permissions`, request.url));
        }
      }
      // If roles array is empty, allow access (permission will be checked at the component/API level)
    }

    // Allow access to the route
    return NextResponse.next();

  } catch (error) {
    console.error('🔒 Middleware error:', error);
    
    // On error, allow access but log the issue
    // This prevents the app from being completely broken due to middleware errors
    return NextResponse.next();
  }
}

/**
 * Client-safe route permission checking (no database operations)
 * This function provides the same permission logic without importing database modules
 */
function getClientSafeRoutePermission(pathname: string) {
  // Define route permission mappings for client-side
  // These MUST match the client-side and server-side route permissions exactly
  const routePermissions: Record<string, { action: string; subject: string; roles: string[] }> = {
    '/dashboard': { action: 'read', subject: 'Settings', roles: [] },
    '/employee-dashboard': { action: 'read', subject: 'Employee', roles: [] },
    '/modules/employee-management': { action: 'read', subject: 'Employee', roles: [] },
    '/modules/customer-management': { action: 'read', subject: 'Customer', roles: [] },
    '/modules/equipment-management': { action: 'read', subject: 'Equipment', roles: [] },
    '/modules/maintenance-management': { action: 'read', subject: 'Maintenance', roles: [] },
    '/modules/company-management': { action: 'read', subject: 'Company', roles: [] },
    '/modules/rental-management': { action: 'read', subject: 'Rental', roles: [] },
    '/modules/quotation-management': { action: 'read', subject: 'Quotation', roles: [] },
    '/modules/payroll-management': { action: 'read', subject: 'Payroll', roles: [] },
    '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', roles: [] },
    '/modules/project-management': { action: 'read', subject: 'Project', roles: [] },
    '/modules/leave-management': { action: 'read', subject: 'Leave', roles: [] },
    '/modules/location-management': { action: 'read', subject: 'Settings', roles: [] },
    '/modules/user-management': { action: 'read', subject: 'User', roles: [] },
    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: [] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: [] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: [] },
    '/modules/document-management': { action: 'read', subject: 'Document', roles: [] },
    '/admin': { action: 'read', subject: 'Settings', roles: [] },
    '/reports': { action: 'read', subject: 'Report', roles: [] },
  };
  
  // Check for exact match first
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }
  
  // Check for sub-routes (e.g., /en/modules/timesheet-management/bulk-submit should match /modules/timesheet-management)
  for (const [route, permission] of Object.entries(routePermissions)) {
    if (pathname.includes(route)) {
      return permission;
    }
  }
  
  return null;
}

/**
 * Get locale from request (Next.js 16 compatible)
 * Uses synchronous cookie/header access via NextRequest
 */
function getLocale(request: NextRequest): string {
  // Check for locale in cookie (Next.js 16 cookies are synchronous via NextRequest)
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  if (localeCookie && localeCookie.value && i18n.locales.includes(localeCookie.value as "en" | "ar")) {
    return localeCookie.value;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0]?.trim())
      .find((lang) => i18n.locales.includes(lang as "en" | "ar"));
    
    if (preferredLocale && i18n.locales.includes(preferredLocale as "en" | "ar")) {
      return preferredLocale;
    }
  }

  return i18n.defaultLocale;
}

/**
 * Next.js 16 Middleware Configuration
 * Matcher pattern for routes that should be processed by middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - let them handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

