import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { i18n } from '@/lib/i18n-config';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Middleware triggered for path:', pathname);
  }

  // Define public routes that should bypass middleware completely
  const publicRoutes = [
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
    // Get the token from the request
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret'
    });

    // If no token, redirect to login
    if (!token) {
      // Get the current locale from the pathname
      const currentLocale = pathname.split('/')[1];
      const validLocale = i18n.locales.includes(currentLocale as "en" | "ar") ? currentLocale : i18n.defaultLocale;
      const loginUrl = new URL(`/${validLocale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is active
    if (token.isActive === false) {
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
  
  return routePermissions[pathname] || null;
}

function getLocale(request: NextRequest): string {
  // Check for locale in cookie
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
