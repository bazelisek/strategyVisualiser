"use client";

import { getAvailableStrategies } from "@/util/strategies/strategies";
import { useEffect, useState } from "react";
import { parseStrategyId } from "@/util/strategies/strategyId";

export function useStrategyName(strategyId: string): string | null {
  const [strategyName, setStrategyName] = useState<string>("");

  useEffect(() => {
      let isActive = true;
      async function handleFetch() {
        const id = parseStrategyId(strategyId);
        if (!id) {
          if (isActive) setStrategyName("");
          return;
        }
        const strategies = await getAvailableStrategies();
        if (!isActive) return;
        setStrategyName(strategies.find((s) => s.id === id)?.name ?? "");
      }
      void handleFetch();
      return () => {
        isActive = false;
      };
    }, [strategyId]);

  return strategyName ?? null;
}
