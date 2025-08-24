import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createUserFromSession, hasRequiredRole, routePermissions } from './lib/rbac/custom-rbac';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that should bypass middleware completely
  const publicRoutes = [
    '/login',
    '/signup', 
    '/test-signup',
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
    '/api/auth/refresh-session', 
    '/api/auth/session'
  ];

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/auth') {
      return pathname.startsWith(route);
    }
    if (route === '/api/auth') {
      return pathname.startsWith(route);
    }
    if (route === '/_next') {
      return pathname.startsWith(route);
    }
    if (route === '/uploads') {
      return pathname.startsWith(route);
    }
    // For exact matches like /login, /signup, /test-signup
    return pathname === route;
  });

  // Check if current path is a static asset
  const isStaticAsset = staticAssets.some(route => pathname.startsWith(route));

  // If it's a public route or static asset, skip middleware completely
  if (isPublicRoute || isStaticAsset) {
    return NextResponse.next();
  }

  // Check if route requires permission - try exact match first, then pattern match
  let routePermission = routePermissions[pathname];
  
  // If no exact match, try to find a pattern match
  if (!routePermission) {
    // Check if pathname starts with any of the module routes
    for (const route in routePermissions) {
      if (pathname.startsWith(route)) {
        routePermission = routePermissions[route];
        break;
      }
    }
  }
  
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
    let user = createUserFromSession({ user: token });
    
    // Special handling for specific emails to ensure SUPER_ADMIN role
    if (token?.email === 'ias.snd2024@gmail.com' || token?.email === 'admin@ias.com') {
      user = {
        id: token.sub || '',
        email: token.email || '',
        name: token.name || '',
        role: 'SUPER_ADMIN',
        isActive: true,
      };
    }
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Debug logging for SUPER_ADMIN access
    if (user.email === 'ias.snd2024@gmail.com' || user.email === 'admin@ias.com') {
      console.log(`🔍 SUPER_ADMIN access check: ${pathname} - User: ${user.email}, Role: ${user.role}`);
      console.log(`🔍 Route permission:`, routePermission);
      console.log(`🔍 Required roles:`, routePermission.roles);
    }
    
    // Check if user has required role or higher
    const hasAccess = hasRequiredRole(user.role, routePermission.roles);

    if (!hasAccess) {
      // Debug logging for access denied
      console.log(`❌ Access denied: ${pathname} - User: ${user.email}, Role: ${user.role}, Required: ${routePermission.roles.join(',')}`);
      
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
