"use server";

import { getServerSession } from "@/auth/server";
import { getBaseUrl } from "../baseURL";
import axios from "axios";

const BASE_URL = getBaseUrl();

export async function deleteStrategy(id: string): Promise<{ error: string | null }> {
  const session = await getServerSession();
  const userEmail = session?.user.email;

  if (!userEmail) {
    return { error: "User not found" };
  }

  await axios.delete(`${BASE_URL}/api/strategies/${id}`);

  return { error: null };
}
