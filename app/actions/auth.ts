"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { LoginInput } from "@/lib/schema";
import type { UserDoc } from "@/lib/types";

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const parsed = LoginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return "Enter your email and password.";

  const user = await db()
    .collection<UserDoc>("users")
    .findOne({ email: parsed.data.email });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return "Wrong email or password.";
  }

  await createSession(user._id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
