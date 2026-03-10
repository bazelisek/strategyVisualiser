"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/joy";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isPending } = useGetAuthStatus();

  useEffect(() => {
    if (isPending) {
      return;
    }

    router.replace(isAuthenticated ? "/visualize" : "/login");
  }, [isAuthenticated, isPending, router]);

  return (
    <div className="loading">
      <CircularProgress />
    </div>
  );
}
