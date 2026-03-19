"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/auth/server";
import { updateHistoryEntry } from "@/util/db/historyDb.server";
import type {
  VisualizerHistoryEntry,
  VisualizerParams,
} from "@/util/visualizerTypes";

export type UpdateVisualizationInput = {
  name?: string;
  params?: Partial<VisualizerParams>;
};

export type UpdateVisualizationResult =
  | { success: true; item: VisualizerHistoryEntry }
  | { success: false; error: string };

export async function updateVisualization(
  id: string,
  updates: UpdateVisualizationInput,
): Promise<UpdateVisualizationResult> {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!id) {
    return { success: false, error: "Missing id" };
  }

  if (typeof updates !== "object" || updates === null) {
    return { success: false, error: "Invalid updates" };
  }

  const updated = updateHistoryEntry(userId, id, updates);

  if (!updated) {
    return { success: false, error: "Visualization not found" };
  }

  const { userId: _removedUserId, ...item } = updated;
  revalidatePath("/history");
  revalidatePath(`/visualize/${id}`);

  return { success: true, item };
}
