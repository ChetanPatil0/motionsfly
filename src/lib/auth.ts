import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        // Rate-limit by email: 10 attempts per 15 minutes, to slow credential
        // stuffing / brute force without locking out a legitimate user for long.
        if (!checkRateLimit(`login:${email}`, 10, 15 * 60 * 1000)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash || !user.isActive || user.deletedAt) {
          return null;
        }

        const valid = await argon2.verify(user.passwordHash, credentials.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "CUSTOMER" | "ADMIN" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
