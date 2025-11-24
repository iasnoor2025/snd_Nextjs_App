'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginRedirect } from './use-login-redirect';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { redirectToLogin } = useLoginRedirect();

  useEffect(() => {
    if (status === 'loading') return;

    if (requireAuth && !session) {
      // Use full reload for session expiry to ensure clean state
      redirectToLogin(true);
    } else if (!requireAuth && session) {
      router.push('/dashboard');
    }
  }, [session, status, requireAuth, router, redirectToLogin]);

  return { session, status, isAuthenticated: !!session };
}
