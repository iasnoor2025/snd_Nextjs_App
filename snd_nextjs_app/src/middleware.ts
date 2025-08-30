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
    '/debug-permissions',
    '/api/debug-auth',
    '/api/timesheets/auto-generate', // Allow timesheet auto-generation
    '/api/rbac/initialize', // Allow RBAC initialization and status check
    '/api/test-db', // Allow database connection testing
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
      // If roles array is empty, only check permissions (no role restrictions)
      if (routePermission.roles.length > 0) {
        // Check if user has any of the required roles
        const userRoles = Array.isArray(token.roles) ? token.roles : [token.role || 'USER'];
        const hasRequiredRole = routePermission.roles.some(requiredRole => 
          userRoles.includes(requiredRole)
        );

        if (!hasRequiredRole) {
          return NextResponse.redirect(new URL('/access-denied?reason=insufficient_permissions', request.url));
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
    '/modules/analytics': { action: 'read', subject: 'Report', roles: [] },
    '/modules/safety-management': { action: 'read', subject: 'Safety', roles: [] },
    '/modules/salary-increments': { action: 'read', subject: 'SalaryIncrement', roles: [] },
    '/modules/reporting': { action: 'read', subject: 'Report', roles: [] },
    '/modules/settings': { action: 'read', subject: 'Settings', roles: [] },
    '/modules/audit-compliance': { action: 'read', subject: 'Report', roles: [] },
    '/modules/document-management': { action: 'read', subject: 'Document', roles: [] },
    '/admin': { action: 'read', subject: 'Settings', roles: [] },
    '/reports': { action: 'read', subject: 'Report', roles: [] },
  };
  
  return routePermissions[pathname] || null;
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
