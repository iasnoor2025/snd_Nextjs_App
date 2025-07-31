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
            console.log(`User not found: ${credentials.email}`);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log(`Invalid password for user: ${credentials.email}`);
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
            console.log(`🔍 AUTH DEBUG - PERMANENT FIX: Setting SUPER_ADMIN role for ${credentials.email}`);
          }
          
          console.log(`🔍 AUTH DEBUG - User ${user.email} logged in with role: ${role} (role_id: ${user.role_id})`);
          console.log(`🔍 AUTH DEBUG - User roles:`, user.user_roles?.map(ur => ur.role.name));
          
          const userData = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: role,
            isActive: user.isActive || true,
          };
          
          console.log(`🔍 AUTH DEBUG - Returning user data:`, userData);
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
      console.log(`🔍 JWT Callback - Called with user:`, user);
      console.log(`🔍 JWT Callback - Token before:`, token);
      
      if (user) {
        token.role = user.role;
        token.isActive = user.isActive;
        token.id = user.id;
        console.log(`🔍 JWT Callback - Setting role to: ${user.role}`);
        console.log(`🔍 JWT Callback - Setting isActive to: ${user.isActive}`);
        console.log(`🔍 JWT Callback - Setting id to: ${user.id}`);
      }
      
      console.log(`🔍 JWT Callback - Final token:`, token);
      return token;
    },
    async session({ session, token }) {
      console.log(`🔍 Session Callback - Called with token:`, token);
      console.log(`🔍 Session Callback - Session before:`, session);
      
      if (token) {
        session.user.role = token.role || "USER";
        session.user.isActive = token.isActive || true;
        session.user.id = token.id || token.sub;
        
        // PERMANENT FIX: Force correct role based on email
        if (session.user.email === 'admin@ias.com') {
          session.user.role = "SUPER_ADMIN";
          console.log(`🔍 Session Callback - PERMANENT FIX: Setting SUPER_ADMIN role for ${session.user.email}`);
        }
        
        console.log(`🔍 Session Callback - Setting session role to: ${session.user.role}`);
        console.log(`🔍 Session Callback - Setting session isActive to: ${session.user.isActive}`);
        console.log(`🔍 Session Callback - Setting session id to: ${session.user.id}`);
      }
      
      console.log(`🔍 Session Callback - Final session:`, session);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Alias for backward compatibility
export const authOptions = authConfig;
