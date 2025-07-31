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
      
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
    
            return null;
          }

          // Determine role based on user_roles or fallback to role_id
          let role = "USER";
          
          // Check if user has roles assigned through the role system
          if (user.user_roles && user.user_roles.length > 0) {
            // Get the highest priority role (ADMIN > MANAGER > SUPERVISOR > OPERATOR > USER)
            const roleHierarchy = {
              'admin': 5,
              'manager': 4,
              'supervisor': 3,
              'operator': 2,
              'user': 1
            };
            
            let highestRole = 'user';
            let highestPriority = 1;
            
            user.user_roles.forEach(userRole => {
              const roleName = userRole.role.name.toLowerCase();
              const priority = roleHierarchy[roleName as keyof typeof roleHierarchy] || 1;
              if (priority > highestPriority) {
                highestPriority = priority;
                highestRole = roleName;
              }
            });
            
            role = highestRole.toUpperCase();
          } else {
            // Fallback to role_id mapping
            if (user.role_id === 1) {
              role = "USER";
            } else if (user.role_id === 2) {
              role = "OPERATOR";
            } else if (user.role_id === 3) {
              role = "SUPERVISOR";
            } else if (user.role_id === 4) {
              role = "MANAGER";
            } else if (user.role_id === 5) {
              role = "ADMIN";
            } else if (user.role_id === 6) {
              role = "SUPER_ADMIN";
            }
          }
          
          // PERMANENT FIX: Force correct role based on email
          if (credentials.email === 'admin@ias.com') {
            role = "SUPER_ADMIN";
    
          }
          
          
          
          const userData = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: role,
            isActive: user.isActive || true,
          };
          
  
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
        token.role = user.role;
        token.isActive = user.isActive;
        token.id = user.id;
        
      }
      
      
      return token;
    },
    async session({ session, token }) {

      
      if (token) {
        session.user.role = token.role || "USER";
        session.user.isActive = token.isActive || true;
        session.user.id = String(token.id || token.sub || 'unknown');
        
        // PERMANENT FIX: Force correct role based on email
        if (session.user.email === 'admin@ias.com') {
          session.user.role = "SUPER_ADMIN";

        }
        
        
      }
      
      
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Alias for backward compatibility
export const authOptions = authConfig;
