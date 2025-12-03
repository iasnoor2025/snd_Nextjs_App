/**
 * Authentication utility functions for Auth.js v5 (next-auth@5.0.0-beta.30)
 * Compatible with Next.js 16
 * 
 * IMPORTANT: Auth.js v5 uses a different API than v4
 * - getServerSession() is replaced by auth()
 * - Sessions are accessed differently in the beta version
 */

import { authConfig } from './auth-config';
import NextAuth from 'next-auth';
import type { Session } from 'next-auth';

/**
 * Initialize NextAuth with our config
 * This creates the auth handlers and helpers
 */
const { handlers, auth: nextAuthAuth, signIn, signOut } = NextAuth(authConfig);

/**
 * Server-side auth helper for API routes
 * This is a compatibility wrapper for getServerSession
 * 
 * Usage in API routes:
 * ```ts
 * import { getServerSession } from '@/lib/auth';
 * 
 * export async function GET(request: NextRequest) {
 *   const session = await getServerSession();
 *   if (!session?.user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // ... rest of your code
 * }
 * ```
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const result = await nextAuthAuth();
    // In NextAuth v5, auth() might return the session directly or wrapped
    // Handle both cases for compatibility
    if (result && 'session' in result) {
      return (result as { session: Session | null }).session;
    }
    return result as Session | null;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Export NextAuth handlers for API routes
 * Used in src/app/api/auth/[...nextauth]/route.ts
 */
export { handlers };

/**
 * Export auth function for use in Server Components and middleware
 */
export const auth = nextAuthAuth;

/**
 * Export sign in/out functions
 */
export { signIn, signOut };

