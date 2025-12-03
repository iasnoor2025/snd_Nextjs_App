'use client';

import { useParams, usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { validateLocale } from '@/lib/locale-utils';

/**
 * Hook to get locale-aware login redirect function
 * Use this instead of router.push('/login') to ensure proper locale handling
 */
export function useLoginRedirect() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  // Get current locale from params or pathname
  const getLocale = (): string => {
    // Try to get from params first
    let locale = validateLocale(params?.locale as string);
    
    // If not in params, try to extract from pathname
    if (!locale && pathname) {
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && ['en', 'ar'].includes(pathParts[0])) {
        locale = pathParts[0];
      }
    }
    
    // Fallback to cookie or default
    if (!locale && typeof document !== 'undefined') {
      const cookieLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];
      
      if (cookieLocale && ['en', 'ar'].includes(cookieLocale)) {
        locale = cookieLocale;
      }
    }
    
    return locale || 'en';
  };

  /**
   * Redirect to login page with proper locale prefix
   * @param useFullReload - If true, uses window.location.href (better for session expiry)
   *                        If false, uses router.push (better for normal navigation)
   */
  const redirectToLogin = (useFullReload = false, callbackUrl?: string) => {
    const locale = getLocale();
    const loginPath = `/${locale}/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;
    
    if (useFullReload) {
      // Use full page reload for session expiry - ensures clean state
      window.location.href = loginPath;
    } else {
      // Use router for normal navigation
      router.push(loginPath);
    }
  };

  return { redirectToLogin, getLocale };
}

