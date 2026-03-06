import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Discord from "next-auth/providers/discord";

// Edge-compatible config — sem imports de Node.js/Prisma
export const authConfig = {
  providers: [GitHub, Discord],
  pages: { signIn: "/login" },
} satisfies NextAuthConfig;
