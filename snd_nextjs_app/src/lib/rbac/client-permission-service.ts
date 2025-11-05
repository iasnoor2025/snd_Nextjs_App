import { Action, Subject } from './custom-rbac';

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  userRole?: string;
  requiredPermissions?: string[];
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// Cache keys
const getSectionsCacheKey = (userId: string) => `accessible_sections_${userId}`;
const getSectionsCacheTimestampKey = (userId: string) => `accessible_sections_timestamp_${userId}`;

// In-memory cache for sections
const sectionsCache = new Map<string, { sections: string[]; timestamp: number }>();

/**
 * Get cached accessible sections
 */
function getCachedAccessibleSections(userId: string): string[] | null {
  // Check memory cache first
  const memoryCache = sectionsCache.get(userId);
  if (memoryCache) {
    const now = Date.now();
    if (now - memoryCache.timestamp < CACHE_TTL) {
      return memoryCache.sections;
    }
  }

  // Check localStorage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(getSectionsCacheKey(userId));
      const cachedTimestamp = localStorage.getItem(getSectionsCacheTimestampKey(userId));

      if (cached && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        if (now - timestamp < CACHE_TTL) {
          const sections = JSON.parse(cached);
          // Store in memory cache
          sectionsCache.set(userId, { sections, timestamp });
          return sections;
        } else {
          // Cache expired, remove it
          localStorage.removeItem(getSectionsCacheKey(userId));
          localStorage.removeItem(getSectionsCacheTimestampKey(userId));
        }
      }
    } catch (error) {
      console.error('Error reading sections from cache:', error);
    }
  }

  return null;
}

/**
 * Cache accessible sections
 */
function setCachedAccessibleSections(userId: string, sections: string[]): void {
  const timestamp = Date.now();

  // Store in memory cache
  sectionsCache.set(userId, { sections, timestamp });

  // Store in localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getSectionsCacheKey(userId), JSON.stringify(sections));
      localStorage.setItem(getSectionsCacheTimestampKey(userId), timestamp.toString());
    } catch (error) {
      console.error('Error caching sections:', error);
    }
  }
}

/**
 * Client-side permission checking using API calls
 * This version is safe to use in the browser
 */
export async function checkUserPermissionClient(
  userId: string,
  action: Action,
  subject: Subject
): Promise<PermissionCheck> {
  try {
    const response = await fetch('/api/permissions/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        action,
        subject,
      }),
    });

    if (!response.ok) {
      console.error('Permission check failed:', response.statusText);
      return { hasPermission: false, reason: 'Permission check failed' };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking permission:', error);
    return { hasPermission: false, reason: 'Network error' };
  }
}

/**
 * Get all accessible sections for a user via API (with caching)
 */
export async function getUserAccessibleSectionsClient(userId: string, forceRefresh = false): Promise<string[]> {
  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = getCachedAccessibleSections(userId);
    if (cached) {
      // Using cached sections - no log needed (silent cache hit)
      return cached;
    }
  }

  try {
    // Fetch from API (without cache-busting to allow browser caching)
    const response = await fetch(`/api/permissions/sections/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    const sections = result.sections || [];
    
    // Cache the result
    setCachedAccessibleSections(userId, sections);
    
    return sections;
  } catch (error) {
    console.error('Error getting accessible sections:', error);
    return [];
  }
}

/**
 * Clear cached accessible sections
 */
export function clearAccessibleSectionsCache(userId: string): void {
  sectionsCache.delete(userId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(getSectionsCacheKey(userId));
      localStorage.removeItem(getSectionsCacheTimestampKey(userId));
    } catch (error) {
      console.error('Error clearing sections cache:', error);
    }
  }
}

/**
 * Check if user has permission for a specific section
 */
export async function hasSectionPermissionClient(
  userId: string,
  section: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/permissions/section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        section,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.hasPermission || false;
  } catch (error) {
    console.error('Error checking section permission:', error);
    return false;
  }
}
