"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";
import ChartLoading from "@/components/common/ChartLoading";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isPending } = useGetAuthStatus();

  useEffect(() => {
    if (isPending) {
      return;
    }

    router.replace(isAuthenticated ? "/history" : "/login");
  }, [isAuthenticated, isPending, router]);

  return (
    <div className="loading">
      <ChartLoading />
    </div>
  );
}
