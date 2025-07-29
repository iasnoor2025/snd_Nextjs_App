import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define route permissions
const routePermissions: Record<string, { action: string; subject: string; roles: string[] }> = {
  '/modules/employee-management': { action: 'read', subject: 'Employee', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'USER'] },
  '/modules/customer-management': { action: 'read', subject: 'Customer', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'USER'] },
  '/modules/equipment-management': { action: 'read', subject: 'Equipment', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'USER'] },
  '/modules/rental-management': { action: 'read', subject: 'Rental', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'USER'] },
  '/modules/payroll-management': { action: 'read', subject: 'Payroll', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
  '/modules/timesheet-management': { action: 'read', subject: 'Timesheet', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR'] },
  '/modules/project-management': { action: 'read', subject: 'Project', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'USER'] },
  '/admin': { action: 'manage', subject: 'Settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  '/reports': { action: 'read', subject: 'Report', roles: ['ADMIN', 'MANAGER', 'SUPERVISOR'] },
};

// Define role hierarchy
const roleHierarchy: Record<string, number> = {
  'SUPER_ADMIN': 6,
  'ADMIN': 5,
  'MANAGER': 4,
  'SUPERVISOR': 3,
  'OPERATOR': 2,
  'USER': 1,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  const publicRoutes = ['/login', '/auth', '/api/auth', '/_next', '/favicon.ico'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires permission
  const routePermission = routePermissions[pathname];
  if (!routePermission) {
    return NextResponse.next(); // Allow access if no specific permission defined
  }

  try {
    // Get JWT token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check user role
    const userRole = token.role as string;
    if (!userRole) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user has required role
    const hasRequiredRole = routePermission.roles.some(role =>
      role.toUpperCase() === userRole.toUpperCase()
    );

    if (!hasRequiredRole) {
      // Redirect to access denied page
      const accessDeniedUrl = new URL('/access-denied', request.url);
      accessDeniedUrl.searchParams.set('requiredRole', routePermission.roles.join(','));
      accessDeniedUrl.searchParams.set('currentRole', userRole);
      return NextResponse.redirect(accessDeniedUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
