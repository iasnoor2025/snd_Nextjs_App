/**
 * NextAuth API Route Handler for Auth.js v5
 * Compatible with Next.js 16 App Router
 * 
 * Auth.js v5 uses a different export pattern than v4
 * The handlers are now imported from our centralized auth config
 */
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
