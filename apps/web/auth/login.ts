"use server";

import { signInWithEmail } from "@/auth/server";

export type AuthResult = {
  success: boolean;
  error?: string;
};

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const result = await signInWithEmail(email, password);
  if (!result.success) {
    return { success: false, error: result.error ?? "Login failed" };
  }

  return { success: true };
}
