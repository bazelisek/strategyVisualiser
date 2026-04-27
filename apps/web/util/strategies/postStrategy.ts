"use server";

import { getServerSession } from "@/auth/server";
import { getBaseUrl } from "../baseURL";
import axios from "axios";
import { StrategySourceFile } from "./sourceFiles";

const BASE_URL = getBaseUrl();

export async function postStrategy({
  name,
  description,
  isPublic,
  strategySourceFiles,
  entryFile,
  configurationOptions,
  requirements
}: {
  name: string;
  description: string;
  isPublic: boolean;
  strategySourceFiles: StrategySourceFile[];
  entryFile: string | null;
  configurationOptions: string;
  requirements: string;
}): Promise<{ error: string | null; }> {
    const session = await getServerSession();
    const userEmail = session?.user.email;
    if (!userEmail) return {error: 'User not found'};

    const data = {
        name,
        description,
        sourceFiles: strategySourceFiles,
        entryFile,
        configuration: configurationOptions,
        ownerEmail: userEmail,
        isPublic,
        requirements
    }

    await axios.post(BASE_URL + "/api/strategies", data)

    return {error: null}
}
