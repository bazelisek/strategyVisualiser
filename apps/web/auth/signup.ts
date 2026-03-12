"use server";

import { signUpWithEmail } from "@/auth/server";
import type { AuthResult } from "./login";

export async function signup(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  const result = await signUpWithEmail(email, password, name, "/history");
  if (!result.success) {
    return { success: false, error: result.error ?? "Sign up failed" };
  }

  return { success: true };
}
