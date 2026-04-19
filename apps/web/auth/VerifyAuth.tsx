"use client";

import { ReactNode, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";
import ChartLoading from "@/components/common/ChartLoading";

export default function VerifyAuth({children} : {children: ReactNode}) {
  const router = useRouter();
  const { isAuthenticated, isPending, refetch } = useGetAuthStatus();

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isPending, router]);

  if (isPending || !isAuthenticated) {
    return (
      <div className="loading">
        <ChartLoading />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="loading">
          <ChartLoading />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
