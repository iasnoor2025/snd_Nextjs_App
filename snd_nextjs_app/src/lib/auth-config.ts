import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
// Switched from Prisma to Drizzle repository
import { findUserByEmailWithRoles, upsertGoogleUser } from './repositories/user-repo';
import bcrypt from "bcryptjs";

export const authConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await findUserByEmailWithRoles(credentials.email);

          if (!user) {
            console.log('🔍 AUTH - User not found:', credentials.email);
            return null;
          }

          if (!user.isActive) {
            console.log('🔍 AUTH - User is inactive:', credentials.email);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('🔍 AUTH - Invalid password for user:', credentials.email);
            return null;
          }

          // Determine role - ALWAYS prioritize admin@ias.com as SUPER_ADMIN
          let role = "USER";
          
          // Special case for admin@ias.com - ALWAYS SUPER_ADMIN
          if (credentials.email === 'admin@ias.com') {
            role = "SUPER_ADMIN";
            console.log('🔍 AUTH - admin@ias.com detected, setting role to SUPER_ADMIN');
          } else {
            // For other users, check user_roles or fallback to role_id
             if (user.user_roles && user.user_roles.length > 0) {
              const roleHierarchy = {
                'SUPER_ADMIN': 1,
                'ADMIN': 2,
                'MANAGER': 3,
                'SUPERVISOR': 4,
                'OPERATOR': 5,
                'EMPLOYEE': 6,
                'USER': 7
              };
              
              let highestRole = 'USER';
              let highestPriority = 7;
              
              user.user_roles.forEach(userRole => {
                const roleName = userRole.role.name.toUpperCase();
                const priority = roleHierarchy[roleName as keyof typeof roleHierarchy] || 7;
                if (priority < highestPriority) {
                  highestPriority = priority;
                  highestRole = roleName;
                }
              });
              
              role = highestRole;
            } else {
              // Fallback to role_id mapping
               if (user.role_id === 1) role = "SUPER_ADMIN";
               else if (user.role_id === 2) role = "ADMIN";
               else if (user.role_id === 3) role = "MANAGER";
               else if (user.role_id === 4) role = "SUPERVISOR";
               else if (user.role_id === 5) role = "OPERATOR";
               else if (user.role_id === 6) role = "EMPLOYEE";
               else if (user.role_id === 7) role = "USER";
            }
          }
          
          const userData = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            national_id: user.national_id || undefined,
            role: role,
            isActive: user.isActive || true,
          };
          
          console.log('🔍 AUTH - Login successful:', user.email, 'Role:', role);
          
          return userData;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect employees to employee dashboard
      if (url.startsWith(baseUrl)) {
        // Check if the user is an employee and redirect to employee dashboard
        // This will be handled in the middleware or page level
        return url;
      }
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google') {
        try {
          // Check if user exists in database
          const existingUser = await findUserByEmailWithRoles(user.email!);

          if (existingUser) {
            // User exists, check if active
            if (!existingUser.isActive) {
              console.log('🔍 GOOGLE AUTH - User is inactive:', user.email);
              return false;
            }
            console.log('🔍 GOOGLE AUTH - Existing user signed in:', user.email);
            return true;
          } else {
            // Create new user for Google OAuth
            await upsertGoogleUser(user.email!, user.name || null);
            console.log('🔍 GOOGLE AUTH - New user created:', user.email);
            return true;
          }
        } catch (error) {
          console.error('🔍 GOOGLE AUTH - Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Set token data from user
        token.role = user.role;
        token.isActive = user.isActive;
        token.id = user.id;
        token.national_id = user.national_id;
        console.log('🔍 JWT - Setting token role:', user.role);
      }
      
      // For Google OAuth users, determine role
      if (account?.provider === 'google' && token.email) {
        try {
          const dbUser = await findUserByEmailWithRoles(token.email);

          if (dbUser) {
            // Determine role for Google user
            let role = "USER";
            
            if (dbUser.user_roles && dbUser.user_roles.length > 0) {
              const roleHierarchy = {
                'SUPER_ADMIN': 1,
                'ADMIN': 2,
                'MANAGER': 3,
                'SUPERVISOR': 4,
                'OPERATOR': 5,
                'EMPLOYEE': 6,
                'USER': 7
              };
              
              let highestRole = 'USER';
              let highestPriority = 7;
              
              dbUser.user_roles.forEach(userRole => {
                const roleName = userRole.role.name.toUpperCase();
                const priority = roleHierarchy[roleName as keyof typeof roleHierarchy] || 7;
                if (priority < highestPriority) {
                  highestPriority = priority;
                  highestRole = roleName;
                }
              });
              
              role = highestRole;
            } else {
              // Fallback to role_id mapping
              if (dbUser.role_id === 1) role = "SUPER_ADMIN";
              else if (dbUser.role_id === 2) role = "ADMIN";
              else if (dbUser.role_id === 3) role = "MANAGER";
              else if (dbUser.role_id === 4) role = "SUPERVISOR";
              else if (dbUser.role_id === 5) role = "OPERATOR";
              else if (dbUser.role_id === 6) role = "EMPLOYEE";
              else if (dbUser.role_id === 7) role = "USER";
            }
            
            token.role = role;
            token.isActive = dbUser.isActive;
            token.id = dbUser.id.toString();
            console.log('🔍 JWT - Google user role set to:', role);
          }
        } catch (error) {
          console.error('🔍 JWT - Error setting Google user role:', error);
        }
      }
      
      // ALWAYS ensure admin@ias.com has SUPER_ADMIN role in token
      if (token.email === 'admin@ias.com') {
        token.role = 'SUPER_ADMIN';
        console.log('🔍 JWT - Forcing SUPER_ADMIN role for admin@ias.com');
      }
      
      console.log('🔍 JWT - Final token role:', token.role);
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        // ALWAYS ensure admin@ias.com has SUPER_ADMIN role in session
        if (token.email === 'admin@ias.com') {
          session.user.role = 'SUPER_ADMIN';
          console.log('🔍 SESSION - Forcing SUPER_ADMIN role for admin@ias.com');
        } else {
          session.user.role = token.role || "USER";
        }
        
        session.user.isActive = token.isActive || true;
        session.user.id = String(token.id || token.sub || 'unknown');
        session.user.national_id = token.national_id;
        
        console.log('🔍 SESSION - Final session role:', session.user.role);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Alias for backward compatibility
export const authOptions = authConfig;
