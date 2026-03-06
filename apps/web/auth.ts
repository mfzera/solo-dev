import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { apiFetchSafe } from "./lib/fetch";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials.email as string)?.trim().toLowerCase();
        const password = credentials.password as string;
        if (!email || !password) return null;

        const user = await apiFetchSafe<{ id: string; email: string; name: string | null }>(
          "/users/verify",
          { method: "POST", body: JSON.stringify({ email, password }) },
        );

        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // OAuth sign-in: upsert user via API (best-effort, don't block sign-in)
      if (account?.provider !== "credentials" && user.email) {
        await apiFetchSafe("/users/upsert", {
          method: "POST",
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
          }),
        });
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials") {
          token.userId = user.id;
        } else if (user.email) {
          const dbUser = await apiFetchSafe<{ id: string }>(
            `/users/profile?email=${encodeURIComponent(user.email)}`,
          );
          // If lookup fails, sign-in will succeed but getSession() returns null
          // (which redirects to login) — safer than crashing
          if (dbUser) token.userId = dbUser.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Always set id — getSession() guards against empty string
      session.user.id = (token.userId as string) ?? "";
      return session;
    },
  },
});
