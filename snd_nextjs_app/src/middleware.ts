import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createUserFromSession, hasRequiredRole, routePermissions } from './lib/rbac/custom-rbac';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and static assets
  const publicRoutes = [
    '/login',
    '/auth',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/access-denied',
    '/uploads',
  ];
  const staticAssets = ['/api/auth/refresh-session', '/api/auth/session'];

  if (
    publicRoutes.some(route => pathname.startsWith(route)) ||
    staticAssets.some(route => pathname.startsWith(route))
  ) {
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
      secret: process.env.NEXTAUTH_SECRET || 'fallback-secret',
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

    // Check if user has required role or higher
    const hasAccess = hasRequiredRole(user.role, routePermission.roles);

    if (!hasAccess) {
      // Redirect to access denied page
      const accessDeniedUrl = new URL('/access-denied', request.url);
      accessDeniedUrl.searchParams.set('requiredRole', routePermission.roles.join(','));
      accessDeniedUrl.searchParams.set('currentRole', user.role);
      return NextResponse.redirect(accessDeniedUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // Try to redirect to login, but fallback to next() if that fails
    try {
      return NextResponse.redirect(new URL('/login', request.url));
    } catch (redirectError) {
      return NextResponse.next();
    }
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
     * - uploads (uploaded files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
