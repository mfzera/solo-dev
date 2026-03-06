import { auth } from "@/auth";

export async function getSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, email: session.user.email! };
}

// Kept for backward compatibility (middleware used to import this)
export const COOKIE_NAME = "solo_token";
