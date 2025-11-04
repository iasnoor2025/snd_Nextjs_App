/**
 * Next-auth (Auth.js v5) TypeScript Type Definitions
 * Compatible with Next.js 16 and next-auth@5.0.0-beta.30
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extend the built-in User type
   */
  interface User extends DefaultUser {
    role?: string;
    isActive?: boolean;
    national_id?: string;
  }

  /**
   * Extend the built-in Session type
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      isActive: boolean;
      national_id?: string;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the built-in JWT type
   */
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    roles?: string[];
    isActive?: boolean;
    national_id?: string;
  }
}
