"use server";

import { prisma } from "./db";
import { signToken, setSessionCookie, clearSessionCookie } from "./auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const token = await signToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);
  redirect("/board");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
