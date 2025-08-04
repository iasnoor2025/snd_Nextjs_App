import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authConfig: NextAuthOptions = {
  providers: [
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
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              user_roles: {
                include: {
                  role: true
                }
              }
            }
          });

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
    async jwt({ token, user }) {
      if (user) {
        // Set token data from user
        token.role = user.role;
        token.isActive = user.isActive;
        token.id = user.id;
        console.log('🔍 JWT - Setting token role:', user.role);
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
        
        console.log('🔍 SESSION - Final session role:', session.user.role);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Alias for backward compatibility
export const authOptions = authConfig;
