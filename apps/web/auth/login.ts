'use server';

export type AuthResult = {
  success: boolean;
  error?: string;
};

export async function login(email: string, password: string): Promise<AuthResult> {
  // TODO: Implement login logic
  return { success: false, error: 'Not implemented' };
}

