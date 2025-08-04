import NextAuth from "next-auth";
import { prisma } from '@/lib/db';
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import bcrypt from "bcryptjs";

// Check for required environment variables
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Map role_id to role name
const roleMap: Record<number, string> = {
  1: 'USER',
  2: 'OPERATOR',
  3: 'SUPERVISOR',
  4: 'MANAGER',
  5: 'ADMIN',
  6: 'SUPER_ADMIN',
};

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET!,
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
          // Find user in local database
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            console.log('User is inactive:', credentials.email);
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password || '');

          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }

          // Get role name from role_id
          const roleName = roleMap[user.role_id] || 'USER';

          // Return user data for NextAuth
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: roleName,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }: { 
      user: any; 
      account: any; 
      profile?: any; 
    }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google') {
        try {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            // User exists, check if active
            if (!existingUser.isActive) {
              console.log('Google user is inactive:', user.email);
              return false;
            }
            return true;
          } else {
            // Create new user from Google OAuth
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || user.email!.split('@')[0],
                password: '', // No password for OAuth users
                isActive: true,
                role_id: 1, // Default to USER role
                email_verified_at: new Date(),
              },
            });
            console.log('Created new user from Google OAuth:', newUser.email);
            return true;
          }
        } catch (error) {
          console.error('Error handling Google OAuth sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }: { token: JWT; user: Record<string, any>; account?: any }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isActive = user.isActive;
      }
      
      // Handle Google OAuth user role assignment
      if (account?.provider === 'google' && user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          if (dbUser) {
            const roleName = roleMap[dbUser.role_id] || 'USER';
            token.role = roleName;
            token.id = dbUser.id.toString();
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          console.error('Error updating JWT for Google user:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
