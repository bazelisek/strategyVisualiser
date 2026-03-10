'use client';
import { authClient } from "@/auth-client";

export function useGetAuthStatus() {
  const {
    data: session,
    isPending,
    error,
    refetch,
  } = authClient.useSession();

  return {
    isAuthenticated: Boolean(session?.user),
    isPending,
    error,
    session,
    refetch,
  };
}