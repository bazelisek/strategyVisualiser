import React from "react";
import { VisualizerHistoryEntry } from "@/util/visualizerTypes";

export function useVisualization(id: string): {
  visualization: VisualizerHistoryEntry | null;
  isLoading: boolean;
  error: string | null;
} {
  const [visualization, setVisualization] =
    React.useState<VisualizerHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/history/" + id, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          setError(
            res.status === 401
              ? "Unauthorized"
              : "Failed to load visualization.",
          );
          return;
        }
        const data = await res.json();
        console.log(data);
        setVisualization(data?.item);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load history", error);
        if (isActive) setError("Failed to load history.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadHistory();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return { visualization, isLoading, error };
}
