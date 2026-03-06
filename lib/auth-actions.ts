"use server";

import { prisma } from "./db";
import { getSession } from "./auth";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function login(formData: FormData) {
  try {
    await signIn("credentials", {
      email: (formData.get("email") as string)?.trim().toLowerCase(),
      password: formData.get("password") as string,
      redirectTo: "/board",
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Invalid email or password." };
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, bio: true, avatarUrl: true },
  });
}

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: data.name ?? undefined,
      bio: data.bio ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
    },
  });
  return {};
}
