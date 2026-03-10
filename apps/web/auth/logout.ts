"use client";

import { authClient } from "@/auth-client";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  return async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login"); // redirect to login page
        },
      },
    });
  };
}
