'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (requireAuth && !session) {
      router.push('/login');
    } else if (!requireAuth && session) {
      router.push('/dashboard');
    }
  }, [session, status, requireAuth, router]);

  return { session, status, isAuthenticated: !!session };
}
