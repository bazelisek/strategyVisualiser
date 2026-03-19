import React from "react";
import { VisualizerHistoryEntry } from "@/util/visualizerTypes";

export function useHistory(): {
  history: VisualizerHistoryEntry[];
  isLoading: boolean;
  error: string | null;
} {
  const [history, setHistory] = React.useState<VisualizerHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/history", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          setError(
            res.status === 401 ? "Unauthorized" : "Failed to load history."
          );
          return;
        }
        const data = await res.json();
        if (isActive) {
          setHistory(Array.isArray(data?.items) ? data.items : []);
        }
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

  return { history, isLoading, error };
}
