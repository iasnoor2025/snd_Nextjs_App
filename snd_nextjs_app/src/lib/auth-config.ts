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
            where: { email: credentials.email }
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

          // Determine role based on role_id
          let role = "USER";
          if (user.role_id === 1) {
            role = "ADMIN";
          } else if (user.role_id === 2) {
            role = "MANAGER";
          } else if (user.role_id === 3) {
            role = "SUPERVISOR";
          } else if (user.role_id === 4) {
            role = "OPERATOR";
          }
          
          console.log(`🔍 AUTH DEBUG - User ${user.email} logged in with role: ${role} (role_id: ${user.role_id})`);
          console.log(`🔍 AUTH DEBUG - role_id type: ${typeof user.role_id}`);
          console.log(`🔍 AUTH DEBUG - role_id === 1: ${user.role_id === 1}`);
          
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
        console.log(`🔍 JWT Callback - Setting role to: ${user.role}`);
        console.log(`🔍 JWT Callback - Setting isActive to: ${user.isActive}`);
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
        
        console.log(`🔍 Session Callback - Setting session role to: ${session.user.role}`);
        console.log(`🔍 Session Callback - Setting session isActive to: ${session.user.isActive}`);
      }
      
      console.log(`🔍 Session Callback - Final session:`, session);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
