'use server';

import type { AuthResult } from './login';

export async function signup(email: string, password: string): Promise<AuthResult> {
  // TODO: Implement sign-up logic
  return { success: false, error: 'Not implemented' };
}

