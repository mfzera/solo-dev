"use server";

import { getSession } from "./auth";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { apiFetch } from "./fetch";

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
  return apiFetch<{ id: string; email: string; name: string | null; bio: string | null; avatarUrl: string | null }>(
    `/users/profile?id=${encodeURIComponent(session.userId)}`,
  );
}

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };
  try {
    await apiFetch("/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ id: session.userId, ...data }),
    });
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
