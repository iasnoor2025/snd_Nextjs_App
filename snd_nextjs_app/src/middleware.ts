import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    '/uploads',
    '/debug-permissions',
    '/api/debug-auth',
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

  // Check if it's an API route that should bypass middleware
  // Only bypass auth routes and public endpoints
  if (pathname.startsWith('/api/auth') || 
      pathname.startsWith('/api/debug') ||
      pathname.startsWith('/api/cron') ||
      pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  try {
    // Get the token from the request
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret'
    });

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is active
    if (token.isActive === false) {
      return NextResponse.redirect(new URL('/access-denied?reason=inactive', request.url));
    }

    // Client-safe route permission checking (no database operations)
    const routePermission = getClientSafeRoutePermission(pathname);
    
    if (routePermission) {
      // Check if user has any of the required roles
      const userRoles = Array.isArray(token.roles) ? token.roles : [token.role || 'USER'];
      const hasRequiredRole = routePermission.roles.some(requiredRole => 
        userRoles.includes(requiredRole)
      );

      if (!hasRequiredRole) {
        return NextResponse.redirect(new URL('/access-denied?reason=insufficient_permissions', request.url));
      }
    }

    // Allow access to the route
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);
    
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
  const routePermissions: Record<string, { action: string; subject: string; roles: string[] }> = {
    '/dashboard': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/employee-dashboard': { action: 'read', subject: 'Employee', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/employee-management': { action: 'read', subject: 'Employee', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/customer-management': { action: 'read', subject: 'Customer', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/equipment-management': { action: 'read', subject: 'Equipment', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/maintenance-management': { action: 'read', subject: 'Maintenance', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/company-management': { action: 'manage', subject: 'Company', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/modules/rental-management': { action: 'read', subject: 'Rental', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/quotation-management': { action: 'read', subject: 'Quotation', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/payroll-management': { action: 'read', subject: 'Payroll', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/project-management': { action: 'read', subject: 'Project', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/leave-management': { action: 'read', subject: 'Leave', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/location-management': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/user-management': { action: 'read', subject: 'User', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/modules/analytics': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/modules/settings': { action: 'read', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    '/modules/audit-compliance': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
    '/admin': { action: 'manage', subject: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
    '/reports': { action: 'read', subject: 'Report', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR'] },
  };

  return routePermissions[pathname] || null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
