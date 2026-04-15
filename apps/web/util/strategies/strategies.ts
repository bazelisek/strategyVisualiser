"use server";

import { getServerSession } from "@/auth/server";
import { fetchDataFromUrl } from "@/util/fetch";
import { User } from "better-auth";
import { getBaseUrl } from "../baseURL";

const BASE_URL = getBaseUrl();

export async function getAvailableStrategies() {
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) {
    return [];
  }

  try {
    const { data } = await fetchDataFromUrl(
      `${BASE_URL}/api/strategies/users/${encodeURIComponent(email)}`
    );
    const privateStrategies = Array.isArray(data?.privateStrategies)
      ? data.privateStrategies
      : [];
    const publicStrategies = Array.isArray(data?.publicStrategies)
      ? data.publicStrategies
      : [];
    const merged = [...privateStrategies, ...publicStrategies];
    const deduped = new Map<number, string>();
    for (const strategy of merged) {
      if (!strategy || typeof strategy.id !== "number") {
        continue;
      }
      deduped.set(strategy.id, `${strategy.id}:${strategy.name}`);
    }
    return Array.from(deduped.values());
  } catch {
    return [];
  }
}

export type Strategy = {
  id: number;
  name: string;
  description: string;
  code: string;
  configuration: string; //should be an object later
  ownerUser: User;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
