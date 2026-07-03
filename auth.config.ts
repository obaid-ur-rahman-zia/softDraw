import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (NO prisma / bcrypt imports here — this is used by middleware).
// Concrete providers + adapter live in auth.ts (Node runtime).
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
  callbacks: {
    // Runs in middleware for every matched request. Return false → redirect to signIn.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Publicly accessible without a session.
      const isPublic =
        pathname === "/" || // guest whiteboard is the landing page
        pathname === "/sign-in" ||
        pathname === "/sign-up" ||
        pathname.startsWith("/draw") || // guest whiteboard (legacy alias)
        pathname.startsWith("/r/") || // public live-collaboration rooms
        pathname.startsWith("/invite") || // invitation accept flow
        pathname.startsWith("/api"); // API routes enforce their own auth

      if (isPublic) return true;

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
