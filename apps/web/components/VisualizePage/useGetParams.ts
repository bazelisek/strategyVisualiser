import { VisualizerHistoryEntry } from "@/util/visualizerTypes";
import { BASE_PATH } from "@/util/env/constants";

export async function getVisualizationParams(
  id: string
): Promise<VisualizerHistoryEntry | null> {
  try {
    const res = await fetch(`${BASE_PATH}/api/history/${encodeURIComponent(id)}`, {
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
