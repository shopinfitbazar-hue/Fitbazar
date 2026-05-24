import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasConfiguredGoogleOAuth } from "@/lib/google-auth";

const hasGoogleOAuth = hasConfiguredGoogleOAuth({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

const providers: NextAuthOptions["providers"] = [];

if (hasGoogleOAuth) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Please enter both email and password.");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
        include: { vendorProfile: true },
      });

      if (!user || !user.password) {
        throw new Error("No account found with that email.");
      }

      if (user.isBanned) {
        throw new Error("Your account has been suspended.");
      }

      const isValid = await bcrypt.compare(credentials.password, user.password);

      if (!isValid) {
        throw new Error("Incorrect password.");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        vendorId: user.vendorProfile?.id ?? null,
      };
    },
  }),
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { vendorProfile: true },
        });

        if (dbUser?.isBanned) {
          throw new Error("Your account has been suspended.");
        }

        if (account?.provider === "google" && dbUser && !dbUser.emailVerified) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              emailVerified: new Date(),
            },
          });
        }

        return true;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        return false;
      }
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role as Role;
        token.vendorId = user.vendorId ?? null;
      }

      if (trigger === "update" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            include: { vendorProfile: true },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.image;
            token.role = dbUser.role;
            token.vendorId = dbUser.vendorProfile?.id ?? null;
          }
        } catch {
          console.error("Failed to refresh user data in JWT callback");
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role;
        session.user.vendorId = token.vendorId ?? null;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const authMeta = {
  hasGoogleOAuth,
};
