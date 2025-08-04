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

          // Determine role based on user_roles or fallback to role_id
          let role = "USER";
          
          // Check if user has roles assigned through the role system
          if (user.user_roles && user.user_roles.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 AUTH - User has roles:', user.user_roles.map(ur => ur.role.name));
            }
            
            // Get the highest priority role (SUPER_ADMIN > ADMIN > MANAGER > SUPERVISOR > OPERATOR > EMPLOYEE > USER)
            const roleHierarchy = {
              'SUPER_ADMIN': 1,  // Highest priority
              'ADMIN': 2,
              'MANAGER': 3,
              'SUPERVISOR': 4,
              'OPERATOR': 5,
              'EMPLOYEE': 6,
              'USER': 7  // Lowest priority
            };
            
            let highestRole = 'USER';
            let highestPriority = 7; // Start with lowest priority
            
            user.user_roles.forEach(userRole => {
              const roleName = userRole.role.name.toUpperCase();
              const priority = roleHierarchy[roleName as keyof typeof roleHierarchy] || 7;
              if (priority < highestPriority) { // Lower number = higher priority
                highestPriority = priority;
                highestRole = roleName;
              }
            });
            
            role = highestRole;
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 AUTH - Assigned role from user_roles:', role);
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 AUTH - Using role_id fallback, role_id:', user.role_id);
            }
            
            // Fallback to role_id mapping - based on actual database structure
            if (user.role_id === 1) {
              role = "SUPER_ADMIN";
            } else if (user.role_id === 2) {
              role = "ADMIN";
            } else if (user.role_id === 3) {
              role = "MANAGER";
            } else if (user.role_id === 4) {
              role = "SUPERVISOR";
            } else if (user.role_id === 5) {
              role = "OPERATOR";
            } else if (user.role_id === 6) {
              role = "EMPLOYEE";
            } else if (user.role_id === 7) {
              role = "USER";
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 AUTH - Assigned role from role_id:', role);
            }
          }
          
          // Remove hardcoded role assignment - use proper role system
          // if (credentials.email === 'admin@ias.com') {
          //   role = "SUPER_ADMIN";
          // }
          
          
          
          const userData = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: role,
            isActive: user.isActive || true,
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 AUTH - Login successful:', user.email, 'Role:', role);
          }
          
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
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 SESSION - Token role:', token.role);
          console.log('🔍 SESSION - Session role:', session.user.role);
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Alias for backward compatibility
export const authOptions = authConfig;
