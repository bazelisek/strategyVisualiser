"use server";

import { getServerSession } from "@/auth/server";
import { getBaseUrl } from "../baseURL";
import axios from "axios";

const BASE_URL = getBaseUrl();

export async function patchStrategy({
  id,
  name,
  description,
  isPublic,
  strategyCode,
  configurationOptions,
}: {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  strategyCode: string;
  configurationOptions: string;
}): Promise<{ error: string | null }> {
  const session = await getServerSession();
  const userEmail = session?.user.email;
  if (!userEmail) return { error: "User not found" };

  const data = {
    name,
    description,
    code: strategyCode,
    configuration: configurationOptions,
    ownerEmail: userEmail,
    isPublic,
  };

  await axios.patch(`${BASE_URL}/api/strategies/${id}`, data);

  return { error: null };
}
