import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routePermissions, hasRequiredRole, createUserFromSession } from './lib/rbac/custom-rbac';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and static assets
  const publicRoutes = ['/login', '/auth', '/api/auth', '/_next', '/favicon.ico', '/access-denied'];
  const staticAssets = ['/api/auth/refresh-session', '/api/auth/session'];
  
  if (publicRoutes.some(route => pathname.startsWith(route)) || 
      staticAssets.some(route => pathname.startsWith(route))) {
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

    // Create user object from token
    const user = createUserFromSession({ user: token });
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Only log in development and not for every request to reduce noise
    if (process.env.NODE_ENV === 'development' && !pathname.includes('/api/')) {
      console.log('🔍 MIDDLEWARE - Pathname:', pathname);
      console.log('🔍 MIDDLEWARE - User role:', user.role);
      console.log('🔍 MIDDLEWARE - Route permission:', routePermission);
    }

    // Check if user has required role or higher
    const hasAccess = hasRequiredRole(user.role, routePermission.roles);

    if (!hasAccess) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 MIDDLEWARE - Access denied for user role:', user.role);
      }
      // Redirect to access denied page
      const accessDeniedUrl = new URL('/access-denied', request.url);
      accessDeniedUrl.searchParams.set('requiredRole', routePermission.roles.join(','));
      accessDeniedUrl.searchParams.set('currentRole', user.role);
      return NextResponse.redirect(accessDeniedUrl);
    }

    // Redirect employees to employee dashboard
    if (user.role === 'EMPLOYEE' && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/employee-dashboard', request.url));
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
