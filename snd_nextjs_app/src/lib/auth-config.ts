import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email === "admin@snd.com" && credentials?.password === "password123") {
          return {
            id: "1",
            email: "admin@snd.com",
            name: "Admin User",
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
};
