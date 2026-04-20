"use server";

import { getServerSession } from "@/auth/server";
import { fetchDataFromUrl } from "@/util/fetch";
import { Strategy } from "@/util/strategies/strategies";
import { getBaseUrl } from "../baseURL";
import { getUserByEmail } from "@/auth/server";
import { User } from "better-auth";

const BASE_URL = getBaseUrl();

export default async function getStrategy(
  id: string,
): Promise<Strategy | null> {
  const session = await getServerSession();
  const isAuthenticated = Boolean(session?.user);
  const userEmail = session?.user.email;

  if (!isAuthenticated || !userEmail) {
    return null;
  }

  const { data, error } = await fetchDataFromUrl(
    BASE_URL + "/api/strategies/" + id,
  );
  if (error) {
    return null;
  }
  const ownerUser =
    (await getUserByEmail(data.ownerEmail)) ??
    ({
      id: `builtin-${data.id}`,
      name: data.ownerEmail?.split("@")[0] ?? "System",
      email: data.ownerEmail ?? "system@strategy.local",
      emailVerified: false,
      image: null,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } satisfies User);
  console.log(data);

  const strategy: Strategy = {
    ownerUser,
    code: data.code,
    configuration: data.configuration,
    requirements: data.requirements,
    createdAt: data.createdAt,
    description: data.description,
    id: data.id,
    isPublic: data.isPublic,
    name: data.name,
    updatedAt: data.updatedAt,
  };

  return strategy;
}
