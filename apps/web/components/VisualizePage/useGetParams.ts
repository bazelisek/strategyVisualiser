import { VisualizerHistoryEntry } from "@/util/visualizerTypes";

export async function useGetParams(
  id: string
): Promise<VisualizerHistoryEntry | null> {
  try {
    const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    if (!res.ok) {
      console.error("Failed to fetch visualization");
      return null;
    }
    const data = await res.json();
    return data?.item ?? null;
  } catch (error) {
    console.error("Failed to fetch visualization", error);
    return null;
  }
}
