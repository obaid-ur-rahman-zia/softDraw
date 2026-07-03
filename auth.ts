import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { slugify } from "@/lib/slug";

const googleEnabled = !!(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Credentials require JWT sessions (DB sessions can't carry credential logins).
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const email =
          typeof raw?.email === "string" ? raw.email.toLowerCase().trim() : "";
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  events: {
    // Adapter-created users (e.g. Google OAuth) get a default team so the
    // dashboard is usable immediately. Credentials users get theirs in signUp.
    async createUser({ user }) {
      if (!user.id) return;
      const org = await prisma.organization.create({
        data: {
          name: user.name ? `${user.name}'s Team` : "My Team",
          slug: slugify(user.name ?? "team"),
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { activeOrgId: org.id },
      });
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id;
      return session;
    },
  },
});
