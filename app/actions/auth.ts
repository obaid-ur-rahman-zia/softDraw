"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { slugify } from "@/lib/slug";

export type AuthActionState = { error?: string } | undefined;

/** Only allow relative in-app redirects (prevents open-redirect). */
function safeCallbackUrl(value: FormDataEntryValue | null): string {
  const url = typeof value === "string" ? value : "";
  return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid email address." };
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);

  // Create the user + a default personal organization so the dashboard is usable immediately.
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const org = await prisma.organization.create({
    data: {
      name: `${name}'s Team`,
      slug: slugify(name),
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeOrgId: org.id },
  });

  const redirectTo = safeCallbackUrl(formData.get("callbackUrl"));
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Could not sign in." };
    throw err; // re-throw redirect
  }
  return undefined;
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInWithCredentials(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };

  const redirectTo = safeCallbackUrl(formData.get("callbackUrl"));
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Invalid email or password." };
    throw err; // re-throw redirect
  }
  return undefined;
}
