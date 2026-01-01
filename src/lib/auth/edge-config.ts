import type { NextAuthConfig } from "next-auth";

// User role type (duplicated to avoid importing from db/schema which uses Node.js APIs)
type UserRole = "superadmin" | "admin" | "user";

/**
 * Edge-compatible auth config (no database adapter)
 * Used for middleware authentication checks
 *
 * IMPORTANT: This file must NOT import any Node.js modules
 * as it runs in the Edge Runtime
 */
export const edgeAuthConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      // Logged-in users visiting auth pages redirect to home
      if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Unauthenticated users visiting protected pages redirect to login
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
};
