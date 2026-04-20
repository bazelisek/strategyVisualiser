"use client";

import { getAvailableStrategies } from "@/util/strategies/strategies";
import { useEffect, useState } from "react";

interface StrategyInfo {
  id: number;
  name: string;
}

export function useStrategyName(strategyId: string): string | null {
  const [strategyName, setStrategyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
      async function handleFetch() {
        setStrategyName((await getAvailableStrategies()).find(s => s.id === +strategyId)?.name ?? '');
      }
      handleFetch();
    }, []);

  return strategyName ?? null;
}